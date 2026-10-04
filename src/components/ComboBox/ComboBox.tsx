import React from "react";
import {
  debounce,
  getMediaPathResults,
  getYouTubeResults,
  getMusicResults,
  getMusicPlaylistResults,
  isHttp,
  isMagnet,
  isYouTube,
} from "../../utils/utils";
import { examples } from "../../utils/examples";
import {
  getMusicReference,
  musicPlatforms,
  musicPlatformNames,
  type MusicPlatform,
} from "../../utils/music";
import ChatVideoCard from "../ChatVideoCard/ChatVideoCard";
import { IconLink, IconX } from "@tabler/icons-react";
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
  platform: "youtube" | MusicPlatform;
  error: string;
};

export class ComboBox extends React.Component<ComboBoxProps, ComboBoxState> {
  state: ComboBoxState = {
    inputMedia: undefined as string | undefined,
    items: [] as SearchResult[],
    loading: false,
    platform: "youtube",
    error: "",
  };
  searchRevision = 0;
  inputRef = React.createRef<HTMLInputElement>();

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
            : await getMusicResults(platform, query);
        items = data;
      }
      if (revision !== this.searchRevision) return;
      this.setState({
        loading: false,
        items,
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

  debouncedSearch = debounce(this.doSearch);

  onChange = (value: string) => {
    ++this.searchRevision;
    this.setState({ inputMedia: value }, this.debouncedSearch);
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
                  error: "",
                },
                () => {
                  if (this.state.inputMedia) this.doSearch();
                },
              );
            }}
          />
          <Autocomplete
            ref={this.inputRef}
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
                  this.state.platform !== "youtube" &&
                  this.state.inputMedia &&
                  !isHttp(this.state.inputMedia)
                ) {
                  if (this.state.loading || !this.state.items[0]) return;
                  this.setMediaAndClose(this.state.items[0].url);
                  e.target.blur();
                  return;
                }
                this.setMediaAndClose(this.state.inputMedia ?? "");
                e.target.blur();
              }
            }}
            rightSection={
              <ActionIcon
                color="red"
                onClick={(e: any) => this.setMediaAndClose("")}
                title="Clear"
              >
                <IconX />
              </ActionIcon>
            }
            leftSection={
              this.state.loading ? <Loader size="sm" /> : <IconLink />
            }
            placeholder={
              this.state.platform === "youtube"
                ? "Enter a video or music link, file URL, magnet link, or YouTube search term"
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
