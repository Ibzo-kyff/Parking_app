// app.config.js (renommez ou créez ce fichier à la place de app.config.json, car il contient du code JS dynamique)

module.exports = ({ config }) => {
  return {
    ...config,
    expo: {
      ...config.expo,
      name: "parking-app",
      scheme: "parking-app",
      slug: "mobilitymali",
      version: "1.0.0",
      orientation: "portrait",
      icon: "./assets/images/icon.png",
      userInterfaceStyle: "light",
      newArchEnabled: true,
      splash: {
        image: "./assets/images/icon.png",
        resizeMode: "contain",
        backgroundColor: "#ffffff"
      },
      ios: {
        supportsTablet: true
      },
      android: {
        usesCleartextTraffic: true,
        adaptiveIcon: {
          foregroundImage: "./assets/adaptive-icon.png",
          backgroundColor: "#ffffff"
        },
        edgeToEdgeEnabled: true,
        package: "com.mobilitysorganization.mobilitymali"
      },
      web: {
        favicon: "./assets/favicon.png"
      },
      plugins: [
        "expo-router",
        "expo-font",
        [
          "expo-notifications",
          {
            "icon": "./assets/images/icon.png",
            "color": "#ff7d00",
            "defaultChannel": "default"
          }
        ]
      ],
      extra: {
        BASE_URL: process.env.BASE_URL || "https://parkapp-pi.vercel.app/api",  // Fallback pour dev local ; EAS override avec le secret
        router: {},  // Conservé de votre app.json
        eas: {
          projectId: "1beaf1c5-0dce-4ab9-9538-ffc58e18ff24"
        }
      },
      owner: "mobilitys-organization"
    }
  };
};