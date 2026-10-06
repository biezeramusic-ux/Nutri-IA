import { Lock, Mail } from 'lucide-react-native';
import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { AuthButton } from '../../components/AuthButton';
import { AuthInput } from '../../components/AuthInput';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { GoogleButton } from '../../components/GoogleButton';
import { colors, font } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail, validatePassword } from '../../services/validation';

export default function LoginScreen() {
  const { signIn, signInWithGoogle } = useAuth();
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string | null; password?: string | null }>({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const submit = async () => {
    const next = { email: validateEmail(email), password: validatePassword(password) };
    setErrors(next);
    if (next.email || next.password) return;

    setLoading(true);
    try {
      // Em caso de sucesso, o guard do Root Layout redireciona para a Home.
      await signIn(email, password);
    } catch (e) {
      Alert.alert('Não foi possível entrar', e instanceof Error ? e.message : 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      // Em caso de sucesso, o guard do Root Layout redireciona para a Home.
      await signInWithGoogle();
    } catch (e) {
      Alert.alert('Login com Google', e instanceof Error ? e.message : 'Tente novamente.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthScreenLayout title="Bem-vindo de volta" subtitle="Inicie sessão para continuar a contar as suas calorias.">
      <View style={styles.form}>
        <AuthInput
          label="E-mail"
          icon={Mail}
          placeholder="o.seu@email.com"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <AuthInput
          ref={passwordRef}
          label="Senha"
          icon={Lock}
          placeholder="A sua senha"
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          passwordToggle
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={() => void submit()}
        />
        <AuthButton title="Entrar" onPress={() => void submit()} loading={loading} disabled={googleLoading} />
        <GoogleButton onPress={() => void handleGoogle()} loading={googleLoading} disabled={loading} title="Continuar com Google" />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Não tem conta? </Text>
        <Link href="/auth/register" replace style={styles.link}>
          Criar conta
        </Link>
      </View>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  form: { gap: 12 },
  footer: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { color: colors.textMuted, fontSize: font.body },
  link: { color: colors.primaryDark, fontSize: font.body, fontWeight: '600' },
});
