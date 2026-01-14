import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

export default function AuthScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password || (isSignUp && !name)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        await signUp(name, email, password);
      } else {
        await signIn(email, password);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.replace("Main");
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSignUp(!isSignUp);
    setName("");
    setEmail("");
    setPassword("");
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + Spacing["4xl"],
          paddingBottom: insets.bottom + Spacing["2xl"],
        },
      ]}
    >
      <View style={styles.logoContainer}>
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <ThemedText type="display" style={styles.appName}>
          Soccer Diary
        </ThemedText>
        <ThemedText type="body" style={styles.tagline}>
          Track your journey to greatness
        </ThemedText>
      </View>

      <View style={styles.form}>
        <ThemedText type="heading" style={styles.formTitle}>
          {isSignUp ? "Create Account" : "Welcome Back"}
        </ThemedText>

        {isSignUp ? (
          <View style={styles.inputContainer}>
            <ThemedText type="small" style={styles.label}>
              Name
            </ThemedText>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={Colors.dark.textSecondary}
              autoCapitalize="words"
              testID="input-name"
            />
          </View>
        ) : null}

        <View style={styles.inputContainer}>
          <ThemedText type="small" style={styles.label}>
            Email
          </ThemedText>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            placeholderTextColor={Colors.dark.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            testID="input-email"
          />
        </View>

        <View style={styles.inputContainer}>
          <ThemedText type="small" style={styles.label}>
            Password
          </ThemedText>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            placeholderTextColor={Colors.dark.textSecondary}
            secureTextEntry
            testID="input-password"
          />
        </View>

        <Button
          onPress={handleSubmit}
          style={styles.submitButton}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.dark.buttonText} />
          ) : isSignUp ? (
            "Sign Up"
          ) : (
            "Sign In"
          )}
        </Button>

        <Pressable onPress={toggleMode} style={styles.toggleButton}>
          <ThemedText type="body" style={styles.toggleText}>
            {isSignUp
              ? "Already have an account? "
              : "Don't have an account? "}
            <ThemedText type="link" style={styles.toggleLink}>
              {isSignUp ? "Sign In" : "Sign Up"}
            </ThemedText>
          </ThemedText>
        </Pressable>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing["2xl"],
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: Spacing["4xl"],
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  appName: {
    color: Colors.dark.text,
    marginBottom: Spacing.xs,
  },
  tagline: {
    color: Colors.dark.textSecondary,
  },
  form: {
    flex: 1,
  },
  formTitle: {
    color: Colors.dark.text,
    marginBottom: Spacing["2xl"],
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.xs,
  },
  input: {
    height: Spacing.inputHeight,
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    color: Colors.dark.text,
  },
  submitButton: {
    marginTop: Spacing.lg,
  },
  toggleButton: {
    marginTop: Spacing["2xl"],
    alignItems: "center",
  },
  toggleText: {
    color: Colors.dark.textSecondary,
  },
  toggleLink: {
    color: Colors.dark.primary,
  },
});
