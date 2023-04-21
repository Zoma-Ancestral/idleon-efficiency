import React, { useCallback, useEffect, useState } from "react";
import { getAuth, getRedirectResult, signInWithRedirect, User } from 'firebase/auth';
import app from "./config";
import { GoogleAuthProvider, signInWithPopup, signInWithCredential, signOut, EmailAuthProvider, OAuthProvider } from "firebase/auth";

import { sendEvent, loginEvent } from '../../lib/gtag';
import { useRouter } from "next/dist/client/router";

export enum AuthStatus {
    Loading,
    Valid,
    NoUser
}

interface AuthData {
    user: User | null
    authStatus: AuthStatus
    logoutFunction: Function
    tokenFunction: Function
    emailLoginFunction: Function
    appleFunction: Function
}

export const AuthContext = React.createContext<AuthData | null>(null);

export const getAuthData = (): AuthData => {
    const contextState = React.useContext(AuthContext);
    if (contextState === null) {
        throw new Error('User information only available within a AuthContext tag');
    }
    return contextState;
};

export const AuthProvider: React.FC<{ appLoading: boolean, data: { data: Map<string, any>, charNames: string[] } | undefined, domain: string, children?: React.ReactNode }> = ({ appLoading, data, domain, children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [authStatus, setAuthStatus] = useState(AuthStatus.Loading);
    const router = useRouter();

    const loginThroughToken = useCallback((id_token: string, callback?: Function) => {
        const auth = getAuth(app);
        const credential = GoogleAuthProvider.credential(id_token, null);
        signInWithCredential(auth, credential)
            .then((result) => {
                setUser(result.user);
                loginEvent("TOKEN");
                setAuthStatus(AuthStatus.Valid);
                router.push("/world-1/stamps");
            }).catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                if (callback) {
                    callback(errorCode);
                }
                console.debug(errorCode, errorMessage);
            });
    }, [])

    const loginThroughEmailPassword = useCallback((email: string, password: string, callback?: Function) => {
        const auth = getAuth(app);
        const credential = EmailAuthProvider.credential(email, password);
        signInWithCredential(auth, credential)
            .then((result) => {
                setUser(result.user);
                loginEvent("EMAIL");
                setAuthStatus(AuthStatus.Valid);
                router.push("/world-1/stamps");
            }).catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                if (callback) {
                    callback(errorCode);
                }
                console.debug(errorCode, errorMessage);
            });
    }, [])

    const getAppleCode = async () => {
        const url = encodeURIComponent(`https://us-central1-idlemmo.cloudfunctions.net/tspa`);
        const codeRes = await fetch(`https://api.allorigins.win/raw?url=${url}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
        return await codeRes.json();
    }

    const loginThroughApple = useCallback(async (callback?: Function) => {
        const auth = getAuth(app);
        const provider = new OAuthProvider('apple.com');

        const appleCodeRes = await getAppleCode();
        console.log(appleCodeRes);

        const params = new URLSearchParams({
            client_id: "com.lavaflame.idleon.service.signin",
            nonce: appleCodeRes.h_nonce,
            redirect_uri: "https://us-central1-idlemmo.cloudfunctions.net/xapsi",
            response_mode: "form_post",
            response_type: "code id_token",
            scope: "email",
            code: appleCodeRes.device_code,
            state: appleCodeRes.statusToken
        })
        window.open(`https://appleid.apple.com/auth/authorize?${params.toString()}`, '_blank', 'popup');

        if (callback) {
            getRedirectResult(auth)
                .then((result) => {
                    if (result) {
                        setUser(result.user);
                        setAuthStatus(AuthStatus.Valid);
                        router.push("/world-1/stamps");
                    }
                }).catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    if (callback) {
                        callback(errorCode);
                    }
                    console.debug(errorCode, errorMessage);
                });
        }
        // else {
        //     await signInWithRedirect(auth, provider);
        // }
    }, [])

    const logout = useCallback(() => {
        const auth = getAuth(app);
        if (user) {
            signOut(auth)
                .then((result) => {
                    sendEvent({
                        action: "logout",
                        category: "engagement",
                        value: 1,
                    });
                    setUser(null);
                    setAuthStatus(AuthStatus.NoUser);
                    router.push('/');
                }).catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    console.log(errorCode, errorMessage);
                });
        }
    }, [user])

    useEffect(() => {
        if (!appLoading && domain == "") {
            setAuthStatus(AuthStatus.Loading);
            const auth = getAuth(app);
            auth.onAuthStateChanged(res => {
                if (res) {
                    setUser(res);
                    setAuthStatus(AuthStatus.Valid);
                }
                else {
                    setUser(null);
                    setAuthStatus(AuthStatus.NoUser);

                }
            });
        }
        else if (domain != "") {
            setAuthStatus(AuthStatus.NoUser);
        }
    }, [user, appLoading, domain]);

    return (
        <AuthContext.Provider value={{
            user: user,
            authStatus: authStatus,
            emailLoginFunction: loginThroughEmailPassword,
            logoutFunction: logout,
            tokenFunction: loginThroughToken,
            appleFunction: loginThroughApple,
        }}>
            {children}
        </AuthContext.Provider>
    );
};
