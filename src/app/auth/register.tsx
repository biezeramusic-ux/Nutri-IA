import { Gift, Lock, Mail, User } from 'lucide-react-native';
import { Link, useRouter } from 'expo-router';
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
import { validateEmail, validateName, validatePassword } from '../../services/validation';
import { tr } from '../../i18n';

interface FormErrors {
  name?: string | null;
  email?: string | null;
  password?: string | null;
}

export default function RegisterScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { signUp, signInWithGoogle } = useAuth();
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [invite, setInvite] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const submit = async () => {
    const next: FormErrors = {
      name: validateName(name),
      email: validateEmail(email),
      password: validatePassword(password),
    };
    setErrors(next);
    if (next.name || next.email || next.password) return;

    setLoading(true);
    try {
      const outcome = await signUp(name, email, password, invite);
      if (outcome === 'confirm_email') {
        Alert.alert(
          'Verifique o seu e-mail',
          tr('Enviámos um link de confirmação. Confirme o e-mail e depois inicie sessão.'),
        );
        router.replace('/auth/login');
      }
      // 'signed_in': o guard do Root Layout leva o utilizador para a Home.
    } catch (e) {
      Alert.alert(tr('Não foi possível criar a conta'), e instanceof Error ? e.message : 'Tente novamente.');
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
    <AuthScreenLayout title={tr('Criar Conta')} subtitle={tr('3 dias grátis para experimentar o Nutri IA.')}>
      <View style={styles.form}>
        <AuthInput
          label={tr('Nome')}
          icon={User}
          placeholder={tr('O seu nome')}
          value={name}
          onChangeText={setName}
          error={errors.name}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
        />
        <AuthInput
          ref={emailRef}
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
          placeholder={tr('Mínimo 6 caracteres')}
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          passwordToggle
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={() => void submit()}
        />
        <AuthInput
          label={tr('Código de convite (opcional)')}
          icon={Gift}
          placeholder={tr('NUTRI-XXXXXX')}
          value={invite}
          onChangeText={(t) => setInvite(t.toUpperCase())}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={14}
          returnKeyType="go"
          onSubmitEditing={() => void submit()}
        />
        <AuthButton title={tr('Criar Conta')} onPress={() => void submit()} loading={loading} disabled={googleLoading} />
        <GoogleButton onPress={() => void handleGoogle()} loading={googleLoading} disabled={loading} title={tr('Registar com Google')} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{tr('Já tem conta?')} </Text>
        <Link href="/auth/login" replace style={styles.link}>{tr('Entrar')}</Link>
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
