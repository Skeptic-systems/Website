export type QuickCommand = {
  id: string;
  titleKey: string;
  descriptionKey: string;
  badgeKey: string;
  tags: readonly string[];
  command: string;
};

export const QUICK_COMMANDS: readonly QuickCommand[] = [
  {
    id: "debian-docker-bootstrap",
    titleKey: "commands.debianDockerBootstrap.title",
    descriptionKey: "commands.debianDockerBootstrap.description",
    badgeKey: "commands.debianDockerBootstrap.badge",
    tags: ["Debian", "Ubuntu", "Docker"],
    command:
      "apt install curl -y && apt install sudo -y && curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh && rm get-docker.sh",
  },
  {
    id: "jellyfin-ts-to-mp4",
    titleKey: "commands.jellyfinTsToMp4.title",
    descriptionKey: "commands.jellyfinTsToMp4.description",
    badgeKey: "commands.jellyfinTsToMp4.badge",
    tags: ["Jellyfin", "FFmpeg", "Media"],
    command:
      "find /var/docker/jellyfin/movies -type f -name '*.ts' -exec bash -c 'for f in \"$@\"; do mp4=\"${f%.ts}.mp4\"; ffmpeg -i \"$f\" -c:v copy -c:a aac -b:a 192k -bsf:a aac_adtstoasc \"$mp4\" && [ -f \"$mp4\" ] && rm -v \"$f\"; done' _ {} +",
  },
];
