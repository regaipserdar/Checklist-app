import path from "path";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import packageJson from './package.json';
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    define: {
        'import.meta.env.VITE_APP_VERSION': JSON.stringify(packageJson.version)
    }
});
