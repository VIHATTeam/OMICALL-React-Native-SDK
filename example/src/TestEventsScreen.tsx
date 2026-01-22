import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    DeviceEventEmitter,
} from 'react-native';
import {
    omiEmitter,
    OmiCallEvent,
    startServices,
    initCallWithUserPassword,
} from 'omikit-plugin';

export const TestEventsScreen = () => {
    const [events, setEvents] = useState<string[]>([]);
    const [isListening, setIsListening] = useState(false);

    const addEvent = (eventText: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setEvents(prev => [`[${timestamp}] ${eventText}`, ...prev.slice(0, 19)]);
    };

    useEffect(() => {
        console.log('🔧 Setting up test event listeners...');
        console.log('🔌 omiEmitter exists:', !!omiEmitter);
        console.log('🔌 omiEmitter type:', typeof omiEmitter);

        setIsListening(true);

        // ✅ Use DeviceEventEmitter directly for all listeners
        console.log('🧪 Using DeviceEventEmitter directly for all listeners...');

        // ✅ Test listeners với DeviceEventEmitter trực tiếp
        const testListener = DeviceEventEmitter.addListener('test', (data: any) => {
            console.log('🧪 DeviceEventEmitter test event received:', data);
            addEvent('TEST');
        });

        const testEventListener = DeviceEventEmitter.addListener('TEST_EVENT', (data: any) => {
            console.log('🧪 DeviceEventEmitter TEST_EVENT received:', data);
            addEvent('TEST_EVENT');
        });

        const callStateListener = DeviceEventEmitter.addListener(
            OmiCallEvent.onCallStateChanged,
            (data: any) => {
                console.log('📞 DeviceEventEmitter call state changed:', data);
                addEvent('CALL_STATE_CHANGED');
            }
        );

        // ✅ Add listeners for other events
        const audioChangeListener = DeviceEventEmitter.addListener(
            OmiCallEvent.onAudioChange,
            (data: any) => {
                console.log('🔊 DeviceEventEmitter audio change:', data);
                addEvent('AUDIO_CHANGE');
            }
        );

        const callQualityListener = DeviceEventEmitter.addListener(
            OmiCallEvent.onCallQuality,
            (data: any) => {
                console.log('📊 DeviceEventEmitter call quality:', data);
                addEvent('CALL_QUALITY');
            }
        );

        console.log('✅ All DeviceEventEmitter listeners registered successfully');

        return () => {
            console.log('🧹 Cleaning up test event listeners...');
            testListener.remove();
            testEventListener.remove();
            callStateListener.remove();
            audioChangeListener.remove();
            callQualityListener.remove();
            setIsListening(false);
            console.log('✅ Test event listeners cleaned up');
        };
    }, []);

    const handleStartServices = async () => {
        try {
            console.log('🚀 Starting services...');
            const result = await startServices();
            console.log('🚀 Start services result:', result);
            Alert.alert('Start Services Result', `Result: ${result}`);
        } catch (e) {
            console.log('❌ Start services error:', e);
            Alert.alert('Start Services Error', `Error: ${e}`);
        }
    };

    const handleDebugModule = () => {
        try {
            console.log('🔍 === MODULE DEBUG INFO ===');

            // ✅ Test NativeModules
            const { NativeModules } = require('react-native');
            console.log('📱 All NativeModules keys:', Object.keys(NativeModules));
            console.log('🔌 OmikitPlugin in NativeModules:', !!NativeModules.OmikitPlugin);

            if (NativeModules.OmikitPlugin) {
                console.log('🔧 OmikitPlugin methods:', Object.keys(NativeModules.OmikitPlugin));
            }

            // ✅ Test DeviceEventEmitter
            const { DeviceEventEmitter } = require('react-native');
            console.log('📡 DeviceEventEmitter exists:', !!DeviceEventEmitter);
            console.log('📡 DeviceEventEmitter methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(DeviceEventEmitter)));

            // ✅ Test omikit-plugin import
            const omikitPlugin = require('omikit-plugin');
            console.log('📦 omikit-plugin exports:', Object.keys(omikitPlugin));

            Alert.alert('Debug Info', 'Check console for detailed module information');
        } catch (e) {
            console.log('❌ Debug error:', e);
            Alert.alert('Debug Error', `Error: ${e}`);
        }
    };

    const clearEvents = () => {
        setEvents([]);
    };

    // ✅ Test function để ẩn thông báo
    const testHideNotificationOnly = async () => {
        try {
            const result = await require('omikit-plugin').hideSystemNotificationOnly();
            addEvent(`Hide Notification Only: ${result ? 'Success' : 'Failed'}`);
            Alert.alert('Result', `Hide notification only: ${result ? 'Success' : 'Failed'}`);
        } catch (error) {
            addEvent(`Hide Notification Only Error: ${error}`);
            Alert.alert('Error', `Hide notification only failed: ${error}`);
        }
    };

    const testHideNotificationAndUnregister = async () => {
        try {
            const result = await require('omikit-plugin').hideSystemNotificationAndUnregister('Test from React Native');
            addEvent(`Hide Notification & Unregister: ${result ? 'Success' : 'Failed'}`);
            Alert.alert('Result', `Hide notification & unregister: ${result ? 'Success' : 'Failed'}`);
        } catch (error) {
            addEvent(`Hide Notification & Unregister Error: ${error}`);
            Alert.alert('Error', `Hide notification & unregister failed: ${error}`);
        }
    };

    const testHideNotificationSafely = async () => {
        try {
            const result = await require('omikit-plugin').hideSystemNotificationSafely();
            addEvent(`Hide Notification Safely: ${result ? 'Success' : 'Failed'}`);
            Alert.alert('Result', `Hide notification safely: ${result ? 'Success' : 'Failed'}`);
        } catch (error) {
            addEvent(`Hide Notification Safely Error: ${error}`);
            Alert.alert('Error', `Hide notification safely failed: ${error}`);
        }
    };

    // ✅ Test register với option ẩn thông báo
    const testRegisterWithHideNotification = async () => {
        try {
            const result = await initCallWithUserPassword({
                userName: '121',
                password: '1jJKD4Ps6X',
                realm: 'vh.omicrm.com',
                isVideo: false,
                fcmToken: 'fPdwn_r9RyWxpFukix14sc:APA91bFJSSikf3UlRsUfFGfcPz3cKqYgME3orA5s43KEttFZirMpkn1fNLk675pPppyqcttSnk9SXYjNzK-Hpnbw02JW_rOgxS8644MyuKyfz2Xm5D1HbZ0',
                hideNotification: true // ✅ Option mới để ẩn thông báo
            });
            addEvent(`Register with Hide Notification: ${result ? 'Success' : 'Failed'}`);
            Alert.alert('Result', `Register with hide notification: ${result ? 'Success' : 'Failed'}`);
        } catch (error) {
            addEvent(`Register with Hide Notification Error: ${error}`);
            Alert.alert('Error', `Register with hide notification failed: ${error}`);
        }
    };

    const testRegisterNormal = async () => {
        try {
            const result = await initCallWithUserPassword({
                userName: '121',
                password: '1jJKD4Ps6X',
                realm: 'vh.omicrm.com',
                isVideo: false,
                fcmToken: 'fPdwn_r9RyWxpFukix14sc:APA91bFJSSikf3UlRsUfFGfcPz3cKqYgME3orA5s43KEttFZirMpkn1fNLk675pPppyqcttSnk9SXYjNzK-Hpnbw02JW_rOgxS8644MyuKyfz2Xm5D1HbZ0',
                hideNotification: false // ✅ Không ẩn thông báo
            });
            addEvent(`Register Normal: ${result ? 'Success' : 'Failed'}`);
            Alert.alert('Result', `Register normal: ${result ? 'Success' : 'Failed'}`);
        } catch (error) {
            addEvent(`Register Normal Error: ${error}`);
            Alert.alert('Error', `Register normal failed: ${error}`);
        }
    };

    // ✅ Test Silent Registration (mặc định của initCallWithUserPassword)
    const testSilentRegistration = async () => {
        try {
            addEvent('🔇 Testing Silent Registration...');
            const result = await initCallWithUserPassword({
                userName: '121',
                password: '1jJKD4Ps6X',
                realm: 'vh.omicrm.com',
                isVideo: false,
                fcmToken: 'fPdwn_r9RyWxpFukix14sc:APA91bFJSSikf3UlRsUfFGfcPz3cKqYgME3orA5s43KEttFZirMpkn1fNLk675pPppyqcttSnk9SXYjNzK-Hpnbw02JW_rOgxS8644MyuKyfz2Xm5D1HbZ0'
            });

            addEvent(`🔇 Silent Registration Result: ${result ? 'SUCCESS' : 'FAILED'}`);
            Alert.alert('Silent Registration', `Result: ${result ? 'SUCCESS - No notification, no auto-unregister' : 'FAILED'}`);
        } catch (error) {
            addEvent(`🔇 Silent Registration Error: ${error}`);
            Alert.alert('Error', `Silent registration failed: ${error}`);
        }
    };

    // ✅ Test Credential Check
    const testCredentialCheck = async () => {
        try {
            addEvent('🔍 Testing Credential Check...');
            const result = await checkCredentials({
                userName: '121',
                password: '1jJKD4Ps6X',
                realm: 'vh.omicrm.com',
                fcmToken: 'fPdwn_r9RyWxpFukix14sc:APA91bFJSSikf3UlRsUfFGfcPz3cKqYgME3orA5s43KEttFZirMpkn1fNLk675pPppyqcttSnk9SXYjNzK-Hpnbw02JW_rOgxS8644MyuKyfz2Xm5D1HbZ0'
            });

            addEvent(`🔍 Credential Check Result: ${result.success ? 'VALID' : 'INVALID'} - ${result.message}`);
            Alert.alert('Credential Check', `Result: ${result.success ? 'VALID - Auto disconnected' : 'INVALID'}\nMessage: ${result.message}`);
        } catch (error) {
            addEvent(`🔍 Credential Check Error: ${error}`);
            Alert.alert('Error', `Credential check failed: ${error}`);
        }
    };

    // ✅ Test Register with Options - No notification
    const testRegisterNoNotification = async () => {
        try {
            addEvent('⚙️ Testing Register with Options (No Notification)...');
            const result = await registerWithOptions({
                userName: '121',
                password: '1jJKD4Ps6X',
                realm: 'vh.omicrm.com',
                isVideo: false,
                fcmToken: 'fPdwn_r9RyWxpFukix14sc:APA91bFJSSikf3UlRsUfFGfcPz3cKqYgME3orA5s43KEttFZirMpkn1fNLk675pPppyqcttSnk9SXYjNzK-Hpnbw02JW_rOgxS8644MyuKyfz2Xm5D1HbZ0',
                showNotification: false,
                enableAutoUnregister: false
            });

            addEvent(`⚙️ Register with Options Result: ${result.success ? 'SUCCESS' : 'FAILED'} - ${result.message}`);
            Alert.alert('Register with Options', `Result: ${result.success ? 'SUCCESS - Custom options applied' : 'FAILED'}\nMessage: ${result.message}`);
        } catch (error) {
            addEvent(`⚙️ Register with Options Error: ${error}`);
            Alert.alert('Error', `Register with options failed: ${error}`);
        }
    };

    // ✅ Test Register with Options - With notification
    const testRegisterWithNotification = async () => {
        try {
            addEvent('⚙️ Testing Register with Options (With Notification)...');
            const result = await registerWithOptions({
                userName: '121',
                password: '1jJKD4Ps6X',
                realm: 'vh.omicrm.com',
                isVideo: false,
                fcmToken: 'fPdwn_r9RyWxpFukix14sc:APA91bFJSSikf3UlRsUfFGfcPz3cKqYgME3orA5s43KEttFZirMpkn1fNLk675pPppyqcttSnk9SXYjNzK-Hpnbw02JW_rOgxS8644MyuKyfz2Xm5D1HbZ0',
                showNotification: true,
                enableAutoUnregister: true
            });

            addEvent(`⚙️ Register with Options Result: ${result.success ? 'SUCCESS' : 'FAILED'} - ${result.message}`);
            Alert.alert('Register with Options', `Result: ${result.success ? 'SUCCESS - With notification and auto-unregister' : 'FAILED'}\nMessage: ${result.message}`);
        } catch (error) {
            addEvent(`⚙️ Register with Options Error: ${error}`);
            Alert.alert('Error', `Register with options failed: ${error}`);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>🧪 Test Events & Notification Control</Text>

            <View style={styles.statusContainer}>
                <Text style={styles.statusText}>
                    Listening: {isListening ? '✅ Active' : '❌ Inactive'}
                </Text>
                <Text style={styles.statusText}>
                    Events received: {events.length}
                </Text>
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={handleStartServices}>
                    <Text style={styles.buttonText}>Start Services</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={handleDebugModule}>
                    <Text style={styles.buttonText}>Debug Module</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.clearButton} onPress={clearEvents}>
                    <Text style={styles.buttonText}>Clear Events</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.eventsContainer}>
                <Text style={styles.eventsTitle}>Events Log:</Text>
                {events.length === 0 ? (
                    <Text style={styles.noEventsText}>No events received yet...</Text>
                ) : (
                    events.map((event, index) => (
                        <Text key={index} style={styles.eventText}>
                            {event}
                        </Text>
                    ))
                )}
            </ScrollView>

            {/* ✅ Notification Control Buttons */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>📱 Notification Control</Text>

                <TouchableOpacity style={styles.button} onPress={testHideNotificationOnly}>
                    <Text style={styles.buttonText}>Hide Notification Only</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, styles.warningButton]} onPress={testHideNotificationAndUnregister}>
                    <Text style={styles.buttonText}>Hide Notification & Unregister</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, styles.safeButton]} onPress={testHideNotificationSafely}>
                    <Text style={styles.buttonText}>Hide Notification Safely (2s delay)</Text>
                </TouchableOpacity>
            </View>

            {/* ✅ Registration Test Buttons */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>🔐 Registration Tests</Text>

                <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={testRegisterNormal}>
                    <Text style={styles.buttonText}>Register Normal (Show Notification)</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, styles.successButton]} onPress={testRegisterWithHideNotification}>
                    <Text style={styles.buttonText}>Register + Auto Hide Notification</Text>
                </TouchableOpacity>
            </View>

            {/* ✅ Silent Registration API Tests */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>🧪 Silent Registration API Tests</Text>

                <TouchableOpacity style={[styles.button, styles.silentButton]} onPress={testSilentRegistration}>
                    <Text style={styles.buttonText}>🔇 Silent Registration</Text>
                    <Text style={styles.buttonSubtext}>No notification, no auto-unregister</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, styles.checkButton]} onPress={testCredentialCheck}>
                    <Text style={styles.buttonText}>🔍 Check Credentials</Text>
                    <Text style={styles.buttonSubtext}>Validate and auto-disconnect</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, styles.optionsButton]} onPress={testRegisterNoNotification}>
                    <Text style={styles.buttonText}>⚙️ Register (No Notification)</Text>
                    <Text style={styles.buttonSubtext}>Custom options: hidden notification</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, styles.normalButton]} onPress={testRegisterWithNotification}>
                    <Text style={styles.buttonText}>⚙️ Register (With Notification)</Text>
                    <Text style={styles.buttonSubtext}>Custom options: show notification</Text>
                </TouchableOpacity>
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
    },
    statusText: {
        fontSize: 16,
        marginBottom: 5,
        color: '#333',
    },
    buttonContainer: {
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
    },
    clearButton: {
        backgroundColor: '#FF3B30',
        padding: 15,
        borderRadius: 8,
    },
    buttonText: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: 'bold',
    },
    eventsContainer: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 15,
    },
    eventsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    noEventsText: {
        fontStyle: 'italic',
        color: '#666',
        textAlign: 'center',
        marginTop: 20,
    },
    eventText: {
        fontSize: 12,
        marginBottom: 5,
        padding: 8,
        backgroundColor: '#f8f8f8',
        borderRadius: 4,
        fontFamily: 'monospace',
        color: '#333',
    },
    section: {
        marginBottom: 20,
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#333',
    },
    primaryButton: {
        backgroundColor: '#007AFF',
    },
    successButton: {
        backgroundColor: '#34C759',
    },
    warningButton: {
        backgroundColor: '#FF9500',
    },
    safeButton: {
        backgroundColor: '#5856D6',
    },
    silentButton: {
        backgroundColor: '#5856D6',
    },
    checkButton: {
        backgroundColor: '#007AFF',
    },
    optionsButton: {
        backgroundColor: '#FF9500',
    },
    buttonSubtext: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 12,
        marginTop: 2,
    },
    normalButton: {
        backgroundColor: '#FF9500',
    },
}); 