import type { ReactNode } from 'react';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';

const theme = {
  token: {
    colorPrimary: '#945532',
    colorInfo: '#945532',
    colorText: '#343941',
    colorTextSecondary: '#657080',
    colorTextPlaceholder: '#657080',
    colorBorder: '#dfe3e8',
    colorBgContainer: '#ffffff',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 13,
    borderRadius: 6,
    controlHeight: 36,
    controlHeightLG: 44,
  },
  components: {
    Select: {
      activeBorderColor: '#945532',
      hoverBorderColor: '#945532',
      activeOutlineColor: 'rgba(137, 85, 55, 0.12)',
      optionActiveBg: '#f5f6f8',
      optionSelectedBg: '#fbf1e7',
      optionSelectedColor: '#62381f',
    },
  },
};

export default function UIProvider({ children }: { children: ReactNode }) {
  return <ConfigProvider locale={viVN} theme={theme}>{children}</ConfigProvider>;
}
