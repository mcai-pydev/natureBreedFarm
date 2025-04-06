
{ pkgs }: {
  deps = [
    pkgs.postgresql
    pkgs.nodejs
    pkgs.nodejs-20_x
    pkgs.nodePackages.typescript
    pkgs.nodePackages.vite
    pkgs.yarn
  ];
}
