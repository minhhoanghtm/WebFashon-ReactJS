import { useEffect } from "react"
import { useWebsiteSettingsStore } from "../store/websiteSettings.store";

export const useDocumentTitle = (title) => {
    const { settings, fetched, fetchSettings } = useWebsiteSettingsStore();

    useEffect(() => {
        if (!fetched) {
            fetchSettings();
        }
    }, [fetched, fetchSettings]);

    useEffect(() => {
        const siteName = settings?.general?.siteName || "404Studio";
        document.title = `${title} - ${siteName}`;
    }, [title, settings]);
}