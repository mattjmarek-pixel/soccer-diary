import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as AppleAuthentication from "expo-apple-authentication";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Feather } from "@expo/vector-icons";

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

type Mode = "options" | "email-signin" | "email-signup";

export default function AuthScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { signInWithApple, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState<Mode>("options");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSuccess = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.replace("Main");
  };

  const handleError = (error: any) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    const msg = error?.message || "Something went wrong. Please try again.";
    if (msg.includes("cancelled") || msg.includes("canceled")) return;
    Alert.alert("Sign-in failed", msg);
  };

  const handleApple = async () => {
    setIsLoading(true);
    try {
      await signInWithApple();
      handleSuccess();
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      handleSuccess();
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async () => {
    if (!email || !password) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Missing fields", "Please enter your email and password.");
      return;
    }
    setIsLoading(true);
    try {
      await signInWithEmail(email, password);
      handleSuccess();
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async () => {
    if (!name || !email || !password) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Missing fields", "Please fill in all fields.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Weak password", "Password must be at least 8 characters.");
      return;
    }
    setIsLoading(true);
    try {
      await signUpWithEmail(name, email, password);
      handleSuccess();
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const logoSection = (
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
  );

  if (mode === "options") {
    return (
      <View
        style={[
          styles.container,
          styles.optionsContent,
          { paddingTop: insets.top + Spacing["4xl"], paddingBottom: insets.bottom + Spacing["2xl"] },
        ]}
      >
        {logoSection}

        <View style={styles.buttonsContainer}>
          {Platform.OS === "ios" ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
              cornerRadius={BorderRadius.sm}
              style={styles.appleButton}
              onPress={handleApple}
            />
          ) : null}

          <Button
            onPress={handleGoogle}
            variant="outline"
            style={styles.socialButton}
            disabled={isLoading}
          >
            <View style={styles.socialButtonContent}>
              <Feather name="globe" size={18} color={Colors.dark.text} style={styles.socialIcon} />
              <ThemedText type="button" style={styles.socialButtonText}>
                Continue with Google
              </ThemedText>
            </View>
          </Button>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <ThemedText type="small" style={styles.dividerText}>
              or
            </ThemedText>
            <View style={styles.dividerLine} />
          </View>

          <Button
            onPress={() => setMode("email-signin")}
            variant="outline"
            style={styles.socialButton}
          >
            <View style={styles.socialButtonContent}>
              <Feather name="mail" size={18} color={Colors.dark.text} style={styles.socialIcon} />
              <ThemedText type="button" style={styles.socialButtonText}>
                Continue with Email
              </ThemedText>
            </View>
          </Button>

          <Pressable onPress={() => setMode("email-signup")} style={styles.toggleButton}>
            <ThemedText type="small" style={styles.toggleText}>
              New here?{" "}
              <ThemedText type="small" style={styles.toggleLink}>
                Create an account
              </ThemedText>
            </ThemedText>
          </Pressable>
        </View>
      </View>
    );
  }

  const isSignUp = mode === "email-signup";

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
      {logoSection}

      <View style={styles.form}>
        <Pressable onPress={() => setMode("options")} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={Colors.dark.textSecondary} />
          <ThemedText type="small" style={styles.backText}>
            Back
          </ThemedText>
        </Pressable>

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
            placeholder={isSignUp ? "At least 8 characters" : "Your password"}
            placeholderTextColor={Colors.dark.textSecondary}
            secureTextEntry
            testID="input-password"
          />
        </View>

        <Button
          onPress={isSignUp ? handleEmailSignUp : handleEmailSignIn}
          style={styles.submitButton}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.dark.buttonText} />
          ) : isSignUp ? (
            "Create Account"
          ) : (
            "Sign In"
          )}
        </Button>

        <Pressable
          onPress={() => {
            setMode(isSignUp ? "email-signin" : "email-signup");
            setName("");
            setEmail("");
            setPassword("");
          }}
          style={styles.toggleButton}
        >
          <ThemedText type="small" style={styles.toggleText}>
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <ThemedText type="small" style={styles.toggleLink}>
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
  optionsContent: {
    paddingHorizontal: Spacing["2xl"],
    justifyContent: "space-between",
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
  buttonsContainer: {
    gap: Spacing.md,
  },
  appleButton: {
    height: 50,
    width: "100%",
  },
  socialButton: {
    height: 50,
  },
  socialButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  socialIcon: {
    marginRight: Spacing.sm,
  },
  socialButtonText: {
    color: Colors.dark.text,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginVertical: Spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.dark.backgroundSecondary,
  },
  dividerText: {
    color: Colors.dark.textSecondary,
  },
  form: {
    flex: 1,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  backText: {
    color: Colors.dark.textSecondary,
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
    height: 52,
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
