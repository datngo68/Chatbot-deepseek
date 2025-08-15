export interface Message {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
    sessionId: string;
}
export interface ChatSession {
    id: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
    messageCount: number;
}
export interface DeepSeekMessage {
    role: 'user' | 'assistant';
    content: string;
}
export interface DeepSeekRequest {
    model: string;
    messages: DeepSeekMessage[];
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
}
export interface DeepSeekResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
        index: number;
        message: DeepSeekMessage;
        finish_reason: string;
    }>;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}
export interface User {
    id: string;
    username: string;
    email: string;
    role?: 'admin' | 'user';
    status?: 'active' | 'inactive' | 'banned';
    createdAt: Date;
    lastLogin?: Date;
    loginCount?: number;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface ChatState {
    sessions: ChatSession[];
    currentSession: ChatSession | null;
    messages: Message[];
    isLoading: boolean;
    error: string | null;
}
export interface Theme {
    mode: 'light' | 'dark';
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
}
export interface AppSettings {
    theme: Theme;
    language: string;
    autoSave: boolean;
    maxTokens: number;
    temperature: number;
}
//# sourceMappingURL=types.d.ts.map