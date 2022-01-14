import { IdleonStorage } from "../firebase/storage";

export const fetcher = async (windowLocation: string, oldDomain: string): Promise<{ data: Map<string, any> | undefined, charNames: string[] | undefined, domain: string }> => {
    let urlDomain = "";
    if (windowLocation != "") {
        let locationSplit = window.location.host.split('.');
        urlDomain = locationSplit[0] === "www" || locationSplit[0] === process.env.NEXT_PUBLIC_ROOT_URL ? "" : locationSplit[0]
    }
    if (urlDomain != oldDomain && urlDomain != "") {
        if (process.env.NEXT_PUBLIC_APP_STAGE == "dev") {
            console.log("Calling local storage")
            try {
                const res = await fetch(`/api/publicProfile?profile=${urlDomain}`);
                if (res.ok) {
                    const jsonData = await res.json();
                    return {
                        data: jsonData as Map<string, any>,
                        charNames: [...Array(9)].map((number, index) => `Player_${index}`),
                        domain: urlDomain
                    }
                }
            }
            catch (e) {
                console.debug(e);
                throw new Error("Failed fetching data for " + urlDomain);
            }
        }
        else {
            try {
                console.log("Calling cloud storage");
                const jsonData = await IdleonStorage.downloadProfile(urlDomain);
                console.log("Got this data");
                if (jsonData) {
                    return {
                        data: jsonData as Map<string, any>,
                        charNames: [...Array(9)].map((number, index) => `Player_${index}`),
                        domain: urlDomain
                    }
                }
            }
            catch (e) {
                console.debug(e);
                throw new Error("Failed fetching data for " + urlDomain);
            }
        }
    }

    return { data: new Map(), charNames: undefined, domain: urlDomain };
}