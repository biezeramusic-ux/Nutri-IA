import { Link, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { AuthButton } from '../../components/AuthButton';
import { AuthInput } from '../../components/AuthInput';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { colors } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail, validateName, validatePassword } from '../../services/validation';

interface FormErrors {
  name?: string | null;
  email?: string | null;
  password?: string | null;
}

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

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
      const outcome = await signUp(name, email, password);
      if (outcome === 'confirm_email') {
        Alert.alert(
          'Verifique o seu e-mail',
          'Enviámos um link de confirmação. Confirme o e-mail e depois inicie sessão.',
        );
        router.replace('/auth/login');
      }
      // 'signed_in': o guard do Root Layout leva o utilizador para a Home.
    } catch (e) {
      Alert.alert('Não foi possível criar a conta', e instanceof Error ? e.message : 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenLayout title="Criar Conta" subtitle="3 dias grátis para experimentar o Nutri AI.">
      <View style={styles.form}>
        <AuthInput
          label="Nome"
          icon="person-outline"
          placeholder="O seu nome"
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
          placeholder="Mínimo 6 caracteres"
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
        <AuthButton title="Criar Conta" onPress={() => void submit()} loading={loading} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Já tem conta? </Text>
        <Link href="/auth/login" replace style={styles.link}>
          Entrar
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
