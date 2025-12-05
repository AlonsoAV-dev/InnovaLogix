import axios from 'axios';

const MAX_RETRIES = 3;
const INITIAL_BACKOFF = 1000; // 1 second

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const ExportService = {
    /**
     * Downloads a report with robust retry logic (Exponential Backoff)
     * and integrity validation (ESC-17).
     * 
     * @param {string} url - The API endpoint to download from
     * @param {string} filename - The name to save the file as
     * @param {function} onStatusChange - Callback for status updates (optional)
     */
    downloadReport: async (url, filename, onStatusChange = () => { }) => {
        let attempt = 0;
        let backoff = INITIAL_BACKOFF;

        while (attempt <= MAX_RETRIES) {
            try {
                onStatusChange(attempt === 0 ? 'Generando...' : `Reintentando (${attempt}/${MAX_RETRIES})...`);

                const response = await axios.get(url, {
                    responseType: 'blob', // Important for binary files
                    timeout: 30000 // 30s timeout
                });

                // Integrity Validation
                if (response.data.size === 0) {
                    throw new Error("El archivo generado está vacío (Integridad fallida)");
                }

                if (response.data.type !== 'application/pdf') {
                    // Check if it's a JSON error disguised as a blob
                    if (response.data.type === 'application/json') {
                        const text = await response.data.text();
                        const json = JSON.parse(text);
                        throw new Error(json.error || "Error del servidor");
                    }
                    // Warn but allow if type is generic binary
                    console.warn("Tipo de archivo inesperado:", response.data.type);
                }

                // Success - Trigger Download
                const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.setAttribute('download', filename);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(downloadUrl);

                onStatusChange('Completado');
                return true;

            } catch (error) {
                console.error(`Export attempt ${attempt + 1} failed:`, error);

                // Don't retry on client errors (4xx) except 429 (Too Many Requests)
                if (error.response && error.response.status >= 400 && error.response.status < 500 && error.response.status !== 429) {
                    throw error;
                }

                attempt++;
                if (attempt > MAX_RETRIES) {
                    onStatusChange('Falló');
                    throw new Error(`No se pudo exportar el archivo después de ${MAX_RETRIES} intentos. Por favor intente más tarde.`);
                }

                // Exponential Backoff
                await sleep(backoff);
                backoff *= 2; // Double the wait time
            }
        }
    }
};
