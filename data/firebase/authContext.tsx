import React, { useEffect, useState } from "react";
import { getAuth, User } from 'firebase/auth';
import app from "./config";
import { GoogleAuthProvider, signInWithPopup, signInWithCredential, signOut, EmailAuthProvider } from "firebase/auth";

import { sendEvent, loginEvent } from '../../lib/gtag';
import { useRouter } from "next/dist/client/router";

interface AuthData {
    user: User | null
    publicProfile: PublicData | null,
    isLoading: boolean
    loginFunction: Function
    logoutFunction: Function
    tokenFunction: Function
    emailLoginFunction: Function
    handlePublicProfile: Function
}

interface PublicData {
    data: Map<string, any>
    charNames: string[]
    profile: string
}

export const AuthContext = React.createContext<AuthData | null>(null);

export const getAuthData = (): AuthData => {
    const contextState = React.useContext(AuthContext);
    if (contextState === null) {
        throw new Error('User information only available within a AuthContext tag');
    }
    return contextState;
};

export const AuthProvider: React.FC<{}> = (props) => {
    const [user, setUser] = useState<User | null>(null);
    const [publicProfile, setPublicProfile] = useState<PublicData | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const loginUser = () => {
        const auth = getAuth(app);
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider)
            .then((result) => {
                const credential = GoogleAuthProvider.credentialFromResult(result);
                setUser(result.user);
                loginEvent("GOGGLE");
                router.push("/stamps");
            }).catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.log(errorCode, errorMessage);
            });
    }

    const loginThroughToken = (id_token: string, callback?: Function) => {
        const auth = getAuth(app);
        const credential = GoogleAuthProvider.credential(id_token, null);
        signInWithCredential(auth, credential)
            .then((result) => {
                setUser(result.user);
                loginEvent("TOKEN");
                router.push("/stamps");
            }).catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                if (callback) {
                    callback(errorCode);
                }
                console.debug(errorCode, errorMessage);
            });
    }

    const loginThroughEmailPassword = (email: string, password: string, callback?: Function) => {
        const auth = getAuth(app);
        const credential = EmailAuthProvider.credential(email, password);
        signInWithCredential(auth, credential)
            .then((result) => {
                setUser(result.user);
                loginEvent("EMAIL");
                router.push("/stamps");
            }).catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                if (callback) {
                    callback(errorCode);
                }
                console.debug(errorCode, errorMessage);
            });
    }

    const logout = () => {
        const auth = getAuth(app);
        if (user) {
            signOut(auth)
                .then((result) => {
                    sendEvent({
                        action: "logout",
                        category: "engagement",
                        value: 1,
                    });
                    router.push('/');
                }).catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    console.log(errorCode, errorMessage);
                });
        }
    }

    const handlePublicProfile = (profile: string, profileData: Map<string, any>, charNames: string[]) => {
        setPublicProfile({
            charNames: charNames,
            data: profileData,
            profile: profile
        });
    }

    useEffect(() => {
        setLoading(true);
        if (publicProfile) {
            setLoading(false);
        }
        else {
            const auth = getAuth(app);
            auth.onAuthStateChanged(res => {
                if (res) {
                    setUser(res);
                }
                else {
                    setUser(null);
                }
                setLoading(false);
            });
        }
    }, [publicProfile, user]);

    return (
        <AuthContext.Provider value={{
            user: user,
            publicProfile: publicProfile,
            isLoading: loading,
            loginFunction: loginUser,
            emailLoginFunction: loginThroughEmailPassword,
            logoutFunction: logout,
            tokenFunction: loginThroughToken,
            handlePublicProfile: handlePublicProfile
        }}>
            {props.children}
        </AuthContext.Provider>
    );
};
