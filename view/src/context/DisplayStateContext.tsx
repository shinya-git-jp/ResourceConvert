import React, { createContext, useState, useContext, type ReactNode, type Dispatch, type SetStateAction } from 'react';

// Context で管理する状態の型定義
interface DisplayState {
    selectedConfigName: string;
    messageSelectedObjectIDs: Set<string>;
    errorMessageSelectedObjectIDs: Set<string>;
    messageIdMap: Record<string, string>;
}

// Context の型定義 (状態 + 更新関数)
interface DisplayStateContextType extends DisplayState {
    setSelectedConfigName: Dispatch<SetStateAction<string>>;
    setMessageSelectedObjectIDs: Dispatch<SetStateAction<Set<string>>>;
    setErrorMessageSelectedObjectIDs: Dispatch<SetStateAction<Set<string>>>;
    setMessageIdMap: Dispatch<SetStateAction<Record<string, string>>>;
}

// Context の作成 (初期値は undefined だが、Provider で必ず値が設定される想定)
const DisplayStateContext = createContext<DisplayStateContextType | undefined>(undefined);

// Provider コンポーネントの作成
interface DisplayStateProviderProps {
    children: ReactNode;
}

export const DisplayStateProvider: React.FC<DisplayStateProviderProps> = ({ children }) => {
    const [selectedConfigName, setSelectedConfigName] = useState<string>("");
    const [messageSelectedObjectIDs, setMessageSelectedObjectIDs] = useState(new Set<string>());
    const [errorMessageSelectedObjectIDs, setErrorMessageSelectedObjectIDs] = useState(new Set<string>());
    const [messageIdMap, setMessageIdMap] = useState<Record<string, string>>({});

    const value = {
        selectedConfigName,
        messageSelectedObjectIDs,
        errorMessageSelectedObjectIDs,
        messageIdMap,
        setSelectedConfigName,
        setMessageSelectedObjectIDs,
        setErrorMessageSelectedObjectIDs,
        setMessageIdMap,
    };

    return (
        <DisplayStateContext.Provider value={value}>
            {children}
        </DisplayStateContext.Provider>
    );
};

// Context を使いやすくするためのカスタムフック
export const useDisplayState = (): DisplayStateContextType => {
    const context = useContext(DisplayStateContext);
    if (context === undefined) {
        throw new Error('useDisplayState must be used within a DisplayStateProvider');
    }
    return context;
};