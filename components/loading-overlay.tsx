import type React from "react"
import CustomLoader from "./loader"

interface LoadingOverlayProps {
    message?: string
    submessage?: string
    forPurpose?: string
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
    message = "Processing your registration...",
    submessage = "Please DO NOT close or refresh this page. This process may take a few moments to complete.",
    forPurpose = "registration",
}) => {
    return (
        <div
            className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center pointer-events-auto overflow-hidden"
            aria-modal="true"
            role="dialog"
        >
            {/* Disable background scroll */}
            <style>{`body { overflow: hidden !important; }`}</style>

            <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-xl max-w-md w-full text-center">
                <div className="flex flex-col items-center justify-center space-y-6">
                    <CustomLoader />

                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-primary">{message}</h3>
                        <p className="text-muted-foreground text-sm">{submessage}</p>

                        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
                            <p className="text-amber-700 dark:text-amber-400 text-sm font-medium">
                                ⚠️ Important: Closing this page will interrupt the {forPurpose} process and may cause issues with your
                                account.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
