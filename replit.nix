
{ pkgs }: {
  deps = [
    pkgs.nodejs-20_x
    pkgs.nodePackages.typescript
    pkgs.nodePackages.vite
    pkgs.nodePackages.npm
    pkgs.nodePackages.yarn
    pkgs.postgresql
  ];
}
