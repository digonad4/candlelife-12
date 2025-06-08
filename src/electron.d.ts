
interface ElectronAPI {
  openFile: () => Promise<string | null>;
  platform: string;
}

declare interface Window {
  electron?: ElectronAPI;
}
