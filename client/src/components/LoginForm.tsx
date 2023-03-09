import { FC, useContext, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Context } from '../index';

const LoginForm: FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const { store } = useContext(Context);

  return (
    <div>
      <div><input type="text" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" /></div>
      <div><input type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
      /></div>

      <button onClick={() => store.login(email, password)}>Sign In</button>
      <button onClick={() => store.registration(email, password)}>Sign Up</button>
    </div>
  );
};

export default observer(LoginForm);
