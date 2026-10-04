import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { AuthButton } from '../../components/AuthButton';
import { AuthInput } from '../../components/AuthInput';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { colors } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail, validatePassword } from '../../services/validation';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string | null; password?: string | null }>({});
  const [loading, setLoading] = useState(false);

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

  return (
    <AuthScreenLayout title="Bem-vindo de volta" subtitle="Inicie sessão para continuar a contar as suas calorias.">
      <View style={styles.form}>
        <AuthInput
          label="E-mail"
          icon="mail-outline"
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
          icon="lock-closed-outline"
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
        <AuthButton title="Entrar" onPress={() => void submit()} loading={loading} />
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
  form: { gap: 16, marginTop: 8 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  footerText: { color: colors.textMuted, fontSize: 14 },
  link: { color: colors.primaryDark, fontSize: 14, fontWeight: '800' },
});
