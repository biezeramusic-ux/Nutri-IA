import { Lock, Mail } from 'lucide-react-native';
import { Link } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Text } from '../../components/AppText';
import { Alert } from '../../i18n/alert';
import { AuthButton } from '../../components/AuthButton';
import { AuthInput } from '../../components/AuthInput';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { GoogleButton } from '../../components/GoogleButton';
import { font, type ThemeColors } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail, validatePassword } from '../../services/validation';
import { tr } from '../../i18n';

export default function LoginScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
      Alert.alert(tr('Não foi possível entrar'), e instanceof Error ? e.message : 'Tente novamente.');
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
      Alert.alert(tr('Login com Google'), e instanceof Error ? e.message : 'Tente novamente.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthScreenLayout title={tr('Bem-vindo de volta')} subtitle={tr('Inicie sessão para continuar a contar as suas calorias.')}>
      <View style={styles.form}>
        <AuthInput
          label={tr('E-mail')}
          icon={Mail}
          placeholder={tr('o.seu@email.com')}
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
          label={tr('Senha')}
          icon={Lock}
          placeholder={tr('A sua senha')}
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
        <AuthButton title={tr('Entrar')} onPress={() => void submit()} loading={loading} disabled={googleLoading} />
        <GoogleButton onPress={() => void handleGoogle()} loading={googleLoading} disabled={loading} title={tr('Continuar com Google')} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{tr('Não tem conta?')} </Text>
        <Link href="/auth/register" replace style={styles.link}>{tr('Criar conta')}</Link>
      </View>
    </AuthScreenLayout>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  form: { gap: 12 },
  footer: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { color: colors.textMuted, fontSize: font.body },
  link: { color: colors.primaryDark, fontSize: font.body, fontWeight: '600' },
});
