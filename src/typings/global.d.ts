declare global {
  type ProxySettings = {
    apiType: string;
    apiIp: string;
    apiPort: string;
    apiSuffix: string;
    wsType: string;
    wsIp: string;
    wsPort: string;
    wsSuffix: string;
  };

  type BaseMenuItem = {
    label: string;
    icon: string;
  };

  type MenuAction = {
    url: string;
    icon: string;
    title: string;
  };
}

export {};
