import React from "react";
import {
  debounce,
  getMediaPathResults,
  getYouTubeResults,
  getBilibiliResults,
  getMusicResults,
  getMusicPlaylistResults,
  isHttp,
  isMagnet,
  isYouTube,
  isBilibili,
} from "../../utils/utils";
import { examples } from "../../utils/examples";
import {
  getMusicReference,
  musicPlatforms,
  musicPlatformNames,
  type MusicPlatform,
} from "../../utils/music";
import ChatVideoCard from "../ChatVideoCard/ChatVideoCard";
import { IconLink, IconSearch, IconX } from "@tabler/icons-react";
import {
  ActionIcon,
  Autocomplete,
  Alert,
  Group,
  Select,
  Loader,
  type AutocompleteProps,
} from "@mantine/core";

type ComboBoxProps = {
  roomSetMedia: (value: string) => void;
  playlistAdd: (value: string) => void;
  roomMedia: string;
  getMediaDisplayName: (input: string) => string;
  mediaPath: string | undefined;
  disabled?: boolean;
};

type ComboBoxState = {
  inputMedia?: string;
  items: SearchResult[];
  loading: boolean;
  dropdownOpened: boolean;
  platform: "youtube" | "bilibili" | MusicPlatform;
  error: string;
};

export class ComboBox extends React.Component<ComboBoxProps, ComboBoxState> {
  state: ComboBoxState = {
    inputMedia: undefined as string | undefined,
    items: [] as SearchResult[],
    loading: false,
    dropdownOpened: false,
    platform: "youtube",
    error: "",
  };
  searchRevision = 0;
  inputRef = React.createRef<HTMLInputElement>();

  usingVideoSearch = () =>
    this.state.platform === "youtube" || this.state.platform === "bilibili";

  setMediaAndClose = async (value: string) => {
    try {
      if (getMusicReference(value)?.kind === "playlist") {
        const tracks = await getMusicPlaylistResults(value);
        for (const track of tracks) this.props.playlistAdd(track.url);
      } else {
        this.props.roomSetMedia(value);
      }
      ++this.searchRevision;
      this.setState({
        inputMedia: undefined,
        items: [],
        loading: false,
        error: "",
      });
    } catch (error) {
      this.setState({
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Music playlist import failed.",
      });
    }
  };

  doSearch = async () => {
    const value = this.state.inputMedia;
    const revision = ++this.searchRevision;
    const platform = this.state.platform;
    this.setState({ loading: true, error: "" });
    const query: string = value || "";
    let items = examples;
    try {
      if (getMusicReference(query)?.kind === "playlist") {
        items = await getMusicPlaylistResults(query);
      } else if (
        query === "" ||
        // Non-link input is searched on the selected platform.
        (query && (isHttp(query) || isMagnet(query)))
      ) {
        if (!value && this.props.mediaPath) {
          items = await getMediaPathResults(this.props.mediaPath, "");
        }
        if (query) {
          let type: SearchResult["type"] = "file";
          if (isYouTube(query)) {
            type = "youtube";
          }
          if (isBilibili(query)) type = "bilibili";
          if (isMagnet(query)) {
            type = "magnet";
          }
          if (getMusicReference(query)?.kind === "song") type = "music";
          // Create entry from user input
          items = [
            {
              name: query,
              type,
              url: query,
              duration: 0,
            },
          ];
        }
      } else {
        const data =
          platform === "youtube"
            ? await getYouTubeResults(query)
            : platform === "bilibili"
              ? await getBilibiliResults(query)
              : await getMusicResults(platform, query);
        items = data;
      }
      if (revision !== this.searchRevision) return;
      this.setState({
        loading: false,
        items,
        dropdownOpened: items.length > 0,
      });
    } catch (error) {
      if (revision !== this.searchRevision) return;
      this.setState({
        items: [],
        loading: false,
        error: error instanceof Error ? error.message : "Search failed.",
      });
    }
  };

  debouncedSearch = debounce(() => {
    const query = this.state.inputMedia || "";
    if (
      !this.usingVideoSearch() ||
      !query ||
      isHttp(query) ||
      isMagnet(query)
    ) {
      this.doSearch();
    }
  });

  onChange = (value: string) => {
    ++this.searchRevision;
    this.setState(
      { inputMedia: value, items: [], loading: false, error: "" },
      this.debouncedSearch,
    );
  };

  render() {
    const { roomMedia: currentMedia, getMediaDisplayName } = this.props;
    const renderOption: AutocompleteProps["renderOption"] = ({ option }) => {
      const video = this.state.items.find((item) => item.url === option.value);
      return (
        <div key={option.value} style={{ width: "100%" }}>
          {video && (
            <ChatVideoCard
              video={video}
              index={0}
              onPlaylistAdd={this.props.playlistAdd}
            />
          )}
        </div>
      );
    };
    return (
      <div style={{ width: "100%" }}>
        <Group gap="xs" wrap="nowrap">
          <Select
            aria-label="Search platform"
            style={{ width: 150, flexShrink: 0 }}
            disabled={this.props.disabled}
            allowDeselect={false}
            value={this.state.platform}
            data={[
              { value: "youtube", label: "YouTube" },
              { value: "bilibili", label: "Bilibili" },
              ...musicPlatforms.map((platform) => ({
                value: platform,
                label: musicPlatformNames[platform],
              })),
            ]}
            onChange={(value) => {
              ++this.searchRevision;
              this.setState(
                {
                  platform: value as ComboBoxState["platform"],
                  items: [],
                  loading: false,
                  error: "",
                },
                () => {
                  const query = this.state.inputMedia;
                  if (
                    query &&
                    (!this.usingVideoSearch() ||
                      isHttp(query) ||
                      isMagnet(query))
                  ) {
                    this.doSearch();
                  }
                },
              );
            }}
          />
          <Autocomplete
            ref={this.inputRef}
            dropdownOpened={this.state.dropdownOpened}
            onDropdownOpen={() => this.setState({ dropdownOpened: true })}
            onDropdownClose={() => this.setState({ dropdownOpened: false })}
            comboboxProps={{
              onOptionSubmit: (value) => {
                this.setMediaAndClose(value);
                this.inputRef.current?.blur();
              },
            }}
            maxDropdownHeight={400}
            style={{ width: "100%" }}
            disabled={this.props.disabled}
            onChange={this.onChange}
            onFocus={(e: any) => {
              this.setState(
                {
                  // Display the real string value (currentMedia) when focused
                  inputMedia:
                    isHttp(currentMedia) || isMagnet(currentMedia)
                      ? currentMedia
                      : getMediaDisplayName(currentMedia),
                },
                () => {
                  if (
                    !this.state.inputMedia ||
                    (this.state.inputMedia &&
                      (isHttp(this.state.inputMedia) ||
                        isMagnet(this.state.inputMedia)))
                  ) {
                    this.doSearch();
                  }
                  e.target.select();
                },
              );
            }}
            onBlur={() => {
              ++this.searchRevision;
              this.setState({
                inputMedia: undefined,
                items: [],
                loading: false,
                dropdownOpened: false,
              });
            }}
            onKeyDown={(e: any) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                // Let Mantine submit the highlighted option before handling raw input.
                const selected = document.getElementById(
                  e.currentTarget.getAttribute("aria-activedescendant") || "",
                );
                if (selected?.hasAttribute("data-combobox-selected")) return;
                if (
                  this.state.inputMedia &&
                  !isHttp(this.state.inputMedia) &&
                  !isMagnet(this.state.inputMedia)
                ) {
                  if (this.usingVideoSearch()) {
                    e.preventDefault();
                    this.doSearch();
                    return;
                  }
                  if (this.state.loading || !this.state.items[0]) return;
                  this.setMediaAndClose(this.state.items[0].url);
                  e.target.blur();
                  return;
                }
                this.setMediaAndClose(this.state.inputMedia ?? "");
                e.target.blur();
              }
            }}
            rightSectionWidth={this.usingVideoSearch() ? 70 : 36}
            rightSectionPointerEvents="auto"
            rightSection={
              <Group gap={0} wrap="nowrap">
                {this.usingVideoSearch() && (
                  <ActionIcon
                    title="Search"
                    aria-label="Search videos"
                    disabled={this.props.disabled || this.state.loading}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => this.doSearch()}
                  >
                    <IconSearch />
                  </ActionIcon>
                )}
                <ActionIcon
                  color="red"
                  onClick={() => this.setMediaAndClose("")}
                  title="Clear"
                >
                  <IconX />
                </ActionIcon>
              </Group>
            }
            leftSection={
              this.state.loading ? <Loader size="sm" /> : <IconLink />
            }
            placeholder={
              this.state.platform === "youtube"
                ? "Enter a link, or search YouTube with Enter / Search"
                : this.state.platform === "bilibili"
                  ? "Enter a link, or search Bilibili with Enter / Search"
                  : `Search ${musicPlatformNames[this.state.platform]} or enter a music song / playlist link`
            }
            value={
              this.state.inputMedia !== undefined
                ? this.state.inputMedia
                : getMediaDisplayName(currentMedia)
            }
            renderOption={renderOption}
            data={this.state.items.map((item) => item.url)}
            filter={({ options }) => options}
          />
        </Group>
        {this.state.error && (
          <Alert color="red" mt="xs">
            {this.state.error}
          </Alert>
        )}
      </div>
    );
  }
}
