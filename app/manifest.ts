import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '우리집 가계부',
    short_name: '가계부',
    description: '가족과 공유하는 일정 및 가계부',
    start_url: '/',
    display: 'standalone',
    background_color: '#2f2a25',
    theme_color: '#2f2a25',
    icons: [
      {
        src: '/next.svg', // 임시 아이콘, 나중에 교체 가능
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
