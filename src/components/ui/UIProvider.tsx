import type { ReactNode } from 'react';
import { ConfigProvider, Grid } from 'antd';
import viVN from 'antd/locale/vi_VN';

const theme = {
  token: {
    colorPrimary: '#563B2C',
    colorPrimaryHover: '#442E22',
    colorPrimaryActive: '#352319',
    colorPrimaryBg: '#F3E8DA',
    colorPrimaryBgHover: '#EDE0D0',
    colorInfo: '#315F82',
    colorInfoBg: '#EDF4FA',
    colorSuccess: '#2E6545',
    colorSuccessBg: '#EDF6EF',
    colorWarning: '#80520E',
    colorWarningBg: '#FFF4DE',
    colorError: '#B13D32',
    colorErrorBg: '#FFF0EB',
    colorText: '#26332C',
    colorTextSecondary: '#75665A',
    colorTextPlaceholder: '#75665A',
    colorBorder: '#9B8878',
    colorBorderSecondary: '#E8DED2',
    colorBgLayout: '#FAF7F2',
    colorBgContainer: '#ffffff',
    fontFamily: '"Be Vietnam Pro", system-ui, sans-serif',
    fontSize: 14,
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
    boxShadow: '0 4px 16px rgb(86 59 44 / 6%)',
    boxShadowSecondary: '0 12px 40px rgb(86 59 44 / 12%)',
    controlHeight: 40,
    controlHeightLG: 48,
  },
  components: {
    Input: { activeBorderColor: '#563B2C', hoverBorderColor: '#563B2C', activeShadow: '0 0 0 2px rgb(86 59 44 / 12%)' },
    Select: {
      activeBorderColor: '#563B2C',
      hoverBorderColor: '#563B2C',
      activeOutlineColor: 'rgb(86 59 44 / 12%)',
      optionActiveBg: '#FAF7F2',
      optionSelectedBg: '#F3E8DA',
      optionSelectedColor: '#563B2C',
    },
    Table: { headerBg: '#FAF7F2', headerColor: '#75665A', rowHoverBg: '#FAF7F2', borderColor: '#E8DED2', cellPaddingBlock: 16 },
    Button: { fontWeight: 500, primaryShadow: 'none', paddingInline: 14 },
    Modal: { borderRadiusLG: 16 },
    Drawer: { footerPaddingBlock: 16, footerPaddingInline: 24 },
  },
};

export default function UIProvider({ children }: { children: ReactNode }) {
  const screens = Grid.useBreakpoint();
  return <ConfigProvider locale={viVN} theme={{ ...theme, token: { ...theme.token, controlHeight: screens.md ? 40 : 44 } }}>{children}</ConfigProvider>;
}
