import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, DeviceEventEmitter } from 'react-native';
import { OmiCallEvent, getKeepAliveStatus, triggerKeepAlivePing } from 'omikit-plugin';

export const TestEventsScreen = () => {
    const [eventLogs, setEventLogs] = useState<string[]>([]);
    const [isListening, setIsListening] = useState(false);
    const [keepAliveStatus, setKeepAliveStatus] = useState<any>(null);

    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setEventLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
    };

    useEffect(() => {
        addLog('🔧 Component mounted, setting up listeners...');
        setIsListening(true);

        // Test listener
        const testListener = DeviceEventEmitter.addListener('test', (data) => {
            addLog(`🧪 Test event received: ${JSON.stringify(data)}`);
        });

        // Call state listener
        const callStateListener = DeviceEventEmitter.addListener(
            OmiCallEvent.onCallStateChanged,
            (data) => {
                addLog(`📞 Call state changed: ${JSON.stringify(data)}`);
            }
        );

        // Other event listeners
        const mutedListener = DeviceEventEmitter.addListener(OmiCallEvent.onMuted, (data) => {
            addLog(`🔇 Muted event: ${data}`);
        });

        const audioListener = DeviceEventEmitter.addListener(OmiCallEvent.onAudioChange, (data) => {
            addLog(`🔊 Audio change: ${JSON.stringify(data)}`);
        });

        addLog('✅ All event listeners registered');

        return () => {
            addLog('🧹 Cleaning up listeners...');
            testListener.remove();
            callStateListener.remove();
            mutedListener.remove();
            audioListener.remove();
            setIsListening(false);
        };
    }, []);

    const clearLogs = () => {
        setEventLogs([]);
        addLog('🗑️ Logs cleared');
    };

    const checkKeepAliveStatus = async () => {
        try {
            const status = await getKeepAliveStatus();
            setKeepAliveStatus(status);
            addLog(`📊 Keep-alive status: ${JSON.stringify(status)}`);
        } catch (error) {
            addLog(`❌ Keep-alive status error: ${error}`);
        }
    };

    const handleManualPing = async () => {
        try {
            addLog('🔄 Triggering manual keep-alive ping...');
            const result = await triggerKeepAlivePing();
            addLog(`${result ? '✅' : '❌'} Manual ping result: ${result}`);
        } catch (error) {
            addLog(`❌ Manual ping error: ${error}`);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Event Testing</Text>

            <View style={styles.statusContainer}>
                <Text style={styles.statusText}>
                    Status: {isListening ? '🟢 Listening' : '🔴 Not Listening'}
                </Text>
                {keepAliveStatus && (
                    <Text style={styles.statusText}>
                        Keep-Alive: {keepAliveStatus.isActive ? '🟢 Active' : '🔴 Inactive'}
                    </Text>
                )}
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={checkKeepAliveStatus}>
                    <Text style={styles.buttonText}>Check Keep-Alive</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={handleManualPing}>
                    <Text style={styles.buttonText}>Manual Ping</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.clearButton} onPress={clearLogs}>
                    <Text style={styles.buttonText}>Clear Logs</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.logsContainer}>
                <Text style={styles.logsTitle}>Event Logs:</Text>
                {eventLogs.map((log, index) => (
                    <Text key={index} style={styles.logText}>
                        {log}
                    </Text>
                ))}
                {eventLogs.length === 0 && (
                    <Text style={styles.noLogsText}>No events yet...</Text>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#333',
    },
    statusContainer: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        marginBottom: 20,
        alignItems: 'center',
    },
    statusText: {
        fontSize: 16,
        fontWeight: '600',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 8,
        flex: 0.48,
    },
    clearButton: {
        backgroundColor: '#FF3B30',
        padding: 15,
        borderRadius: 8,
        flex: 0.48,
    },
    buttonText: {
        color: '#fff',
        textAlign: 'center',
        fontWeight: '600',
    },
    logsContainer: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 15,
    },
    logsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    logText: {
        fontSize: 12,
        marginBottom: 5,
        fontFamily: 'monospace',
        color: '#666',
    },
    noLogsText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginTop: 20,
    },
}); 