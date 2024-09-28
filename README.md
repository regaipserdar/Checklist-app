# Security Dashboard

## Proje Özeti

Bu proje, güvenlik testleri ve analizleri için interaktif bir dashboard uygulamasıdır. JWT token testleri gibi güvenlik kontrolleri için görsel bir akış editörü sağlar ve GitHub entegrasyonu ile versiyon kontrolü imkanı sunar.

## Özellikler

- İnteraktif flow editörü
- JWT token test adımları
- GitHub entegrasyonu
- Detaylı açıklama paneli
- Arama fonksiyonu
- Responsive tasarım

## Kullanılan Teknolojiler

- React
- React Flow
- Tailwind CSS
- Shadcn UI
- GitHub API
- npm install react react-dom react-scripts reactflow tailwindcss @headlessui/react @heroicons/react
- npx shadcn-ui@latest init

## Proje Yapısı

```
security-dashboard/
├── public/
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   ├── Editor/
│   │   ├── DescriptionPanel/
│   │   └── Common/
│   ├── hooks/
│   ├── services/
│   ├── context/
│   ├── styles/
│   ├── utils/
│   ├── App.js
│   └── index.js
├── .gitignore
├── package.json
└── README.md
```

## Kurulum

1. Repoyu klonlayın:
   ```
   git clone https://github.com/regaipserdar/security-dashboard.git
   ```

2. Proje dizinine gidin:
   ```
   cd security-dashboard
   ```

3. Bağımlılıkları yükleyin:
   ```
   npm install
   ```

4. Uygulamayı başlatın:
   ```
   npm start
   ```

## Kullanım

- Flow editörü kullanarak güvenlik test adımlarınızı oluşturun.
- Her adım için açıklama, payload ve araç listesi ekleyin.
- GitHub entegrasyonu ile çalışmalarınızı kaydedin ve sürüm kontrolü yapın.

## Katkıda Bulunma

1. Bu repoyu fork edin
2. Yeni bir feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Branch'inizi push edin (`git push origin feature/AmazingFeature`)
5. Bir Pull Request oluşturun

## Bash Script 
,,,
mkdir -p src/{components,pages,styles,utils,hooks,context,types} && touch src/{components,pages,styles,utils,hooks,context,types}/.gitkeep && touch src/App.tsx src/index.tsx
,,,

## Lisans

Bu proje [MIT Lisansı](https://choosealicense.com/licenses/mit/) altında lisanslanmıştır.

## İletişim

Proje Sahibi - [@regaipserdar](https://github.com/regaipserdar)

Proje Linki: [https://github.com/regaipserdar/security-dashboard](https://github.com/regaipserdar/security-dashboard)