import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring, 
  withSequence,
  runOnJS,
  Easing 
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function SplashAnimation({ onFinish }) {
  // Animation values
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0.8);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(20);

  useEffect(() => {
    // 1. Start setup: Icon scales up
    scale.value = withSpring(1, { damping: 12 });
    
    // 2. Text fades in and slides up
    textOpacity.value = withTiming(1, { duration: 800 });
    textTranslateY.value = withTiming(0, { duration: 800, easing: Easing.out(Easing.exp) });

    // 3. Exit sequence after a delay
    setTimeout(() => {
      // Fade out the whole container
      opacity.value = withTiming(0, { duration: 500 }, (finished) => {
        if (finished && onFinish) {
          runOnJS(onFinish)();
        }
      });
      // Optional: Scale up rapidly on exit for a "zoom into app" effect
      scale.value = withTiming(5, { duration: 500 });
    }, 3000); // Wait 2s before exiting
  }, []);

  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      // Ensure it stays on top of everything
      zIndex: 1000,
    };
  });

  const iconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const textStyle = useAnimatedStyle(() => {
    return {
      opacity: textOpacity.value,
      transform: [{ translateY: textTranslateY.value }],
    };
  });

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Animated.View style={[styles.contentContainer, iconStyle]}>
        <Image 
          source={require('../../assets/images/icon.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Animated.View style={[styles.textContainer, textStyle]}>
          <Text style={styles.title}>NairaStudent</Text>
          <Text style={styles.subtitle}>Manage your student finances</Text>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff', // Match your branding
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
    borderRadius: 30, // Fits the icon shape usually
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
    // Add custom font if available
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
});
