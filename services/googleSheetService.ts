import { GOOGLE_SCRIPT_URL } from '../config';
import { UserData } from '../types';

export const fetchData = async (password: string): Promise<UserData> => {
    if (!GOOGLE_SCRIPT_URL) {
        const errorMsg = "Google Script URL is not configured. Please update config.ts";
        alert(errorMsg);
        throw new Error(errorMsg);
    }
    
    try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?password=${encodeURIComponent(password)}`);
        if (!response.ok) {
            throw new Error('Failed to fetch data from Google Sheet. Check permissions and URL.');
        }
        return await response.json();
    } catch(e) {
        console.error("Error fetching data:", e);
        alert("Could not fetch your data. Please check your internet connection and ensure the Google Script is set up correctly.");
        throw e;
    }
};

export const saveData = async (password: string, data: UserData): Promise<void> => {
    if (!GOOGLE_SCRIPT_URL) {
        console.error("Google Script URL is not configured. Please update config.ts");
        return;
    }

    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ password, data }),
            headers: {
              // This content type avoids a CORS preflight request that Apps Script doesn't handle.
              "Content-Type": "text/plain;charset=utf-8",
            },
            // By removing 'mode: no-cors', we can read the response and handle errors.
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Server returned an error response' }));
            throw new Error(errorData.error || `Failed to save data. Server responded with status ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || 'An unknown error occurred while saving.');
        }

    } catch(e: any) {
        console.error("Error saving data:", e);
        alert(`Failed to save data to the cloud. Your changes might be lost. Error: ${e.message}`);
        // Optionally, re-throw the error if the calling context needs to handle it
        throw e;
    }
};
