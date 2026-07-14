import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/ui/button";
import { AlertTriangle } from "lucide-react";
import i18next from "i18next";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
                    <div className="max-w-md w-full text-center space-y-4">
                        <div className="flex justify-center">
                            <div className="p-3 bg-destructive/10 rounded-full">
                                <AlertTriangle className="w-8 h-8 text-destructive" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-foreground">{i18next.t('errors.somethingWentWrong')}</h1>
                        <p className="text-muted-foreground">
                            {this.state.error?.message || i18next.t('errors.unexpectedError')}
                        </p>
                        <Button
                            onClick={() => {
                                this.setState({ hasError: false, error: null });
                                window.location.reload();
                            }}
                        >
                            {i18next.t('errors.refreshPage')}
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
