"use client";

import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

type NeoBrutalismAuthProps = {
    onLogin: (user: any) => void;
};

export const NeoBrutalismAuth: React.FC<NeoBrutalismAuthProps> = ({ onLogin }) => {
    const [mode, setMode] = useState<"login" | "register">("login");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    const loginMutation = useMutation(api.auth.login);
    const registerMutation = useMutation(api.auth.register);

    const handleSubmit = async () => {
        try {
            setError(null);
            let user;
            if (mode === "login") {
                user = await loginMutation({ username, password });
            } else {
                user = await registerMutation({ username, password });
            }
            onLogin(user);
        } catch (e: any) {
            setError(e.message || "Auth failed");
        }
    };

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen bg-[#ffb7b2] font-sans">

            <div className="relative bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-96 transform hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 overflow-hidden">

                {/* Window Title Bar */}
                <div className="bg-[#ffef96] border-b-4 border-black p-3 flex items-center justify-between">
                    <p className="font-black text-2xl italic tracking-tighter">
                        CON//TEXT
                    </p>
                    <div className="flex gap-2">
                        <div className="w-4 h-4 rounded-full border-2 border-black bg-[#ffb7b2]"></div>
                        <div className="w-4 h-4 rounded-full border-2 border-black bg-[#a2d2ff]"></div>
                    </div>
                </div>

                <div className="p-8">
                    <h1 className="text-4xl font-black mb-8 border-b-4 border-black pb-2 uppercase text-center tracking-tighter">
                        {mode === "login" ? "Sign In" : "Join Us"}
                    </h1>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-xl font-bold mb-2 uppercase">Username</label>
                            <input
                                className="w-full border-4 border-black p-3 font-bold text-lg focus:outline-none focus:bg-[#FFF4E0] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-xl font-bold mb-2 uppercase">Password</label>
                            <input
                                type="password"
                                className="w-full border-4 border-black p-3 font-bold text-lg focus:outline-none focus:bg-[#FFF4E0] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        {error && (
                            <div className="bg-[#FF9494] border-4 border-black p-3 font-bold text-center animate-pulse">
                                ⚠️ {error}
                            </div>
                        )}

                        <button
                            className="w-full bg-[#a2d2ff] border-4 border-black py-4 text-xl font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none hover:bg-[#bde0fe] active:bg-[#bde0fe] transition-all"
                            onClick={handleSubmit}
                        >
                            {mode === "login" ? "Let Me In" : "Get Started"}
                        </button>

                        <div className="flex justify-center pt-2">
                            <button
                                className="text-sm font-bold underline decoration-2 decoration-black underline-offset-4 hover:bg-black hover:text-white px-2 py-1 transition-colors"
                                onClick={() => {
                                    setMode(mode === "login" ? "register" : "login");
                                    setError(null);
                                }}
                            >
                                {mode === "login" ? "Switch to Register" : "Switch to Login"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
