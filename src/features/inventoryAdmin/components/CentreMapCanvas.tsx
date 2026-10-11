import React from 'react';
import { WebView } from 'react-native-webview';
export interface CentreMapCanvasProps { html: string; onMessage: (message: string) => void; onError: () => void }
export default function CentreMapCanvas({ html, onMessage, onError }: CentreMapCanvasProps) {
  return <WebView style={{ flex: 1 }} source={{ html }} originWhitelist={['*']}
    applicationNameForUserAgent="BloodConnect/1.0 DonationCentrePicker"
    cacheEnabled mixedContentMode="never" javaScriptCanOpenWindowsAutomatically={false}
    onShouldStartLoadWithRequest={request => request.url === 'about:blank' || request.url.startsWith('about:blank#')}
    onMessage={event => onMessage(event.nativeEvent.data)} onError={onError}
    onContentProcessDidTerminate={onError} onRenderProcessGone={onError} />;
}
