const { createApp, reactive, onMounted } = Vue;

createApp({
  setup() {
    /* ---------------- state ---------------- */
    const form = reactive({ username: '', password: '', captcha: '' });
    const state = reactive({
      captchaImg: '',
      token: '',
      cookie: '',
      courses: [],
      dialog: null,
      loading: false,
      err: '',
      toastTimer: null,          // 控制错误提示
    });

    /* ---------------- utils ---------------- */
    const showError = (msg) => {
      clearTimeout(state.toastTimer);
      state.err = msg;
      state.toastTimer = setTimeout(() => (state.err = ''), 4000);
    };

    /* ---------------- captcha ---------------- */
    const fetchCaptcha = async () => {
      state.loading = true;
      try {
        const { data } = await axios.get('/api/captcha');
        state.token = data.token;
        state.captchaImg = data.img;
        form.captcha = '';
      } catch {
        showError('验证码获取失败，请重试');
      } finally {
        state.loading = false;
      }
    };

    /* ---------------- login ---------------- */
    const login = async () => {
      if (!form.username || !form.password || !form.captcha) {
        showError('请完整填写学号、密码和验证码');
        return;
      }
      state.loading = true;
      try {
        const { data } = await axios.post('/api/login', {
          token: state.token,
          username: form.username,
          password: form.password,
          captcha: form.captcha,
        });
        state.cookie = data.cookie;
        await loadGrades();
      } catch (e) {
        showError(e.response?.data?.error || '登录失败，请检查输入');
        await fetchCaptcha();
      } finally {
        state.loading = false;
      }
    };

    /* ---------------- grade list ---------------- */
    const loadGrades = async () => {
      try {
        const { data } = await axios.post('/api/grades', {
          cookie: state.cookie,
        });
        state.courses = data;
      } catch {
        showError('成绩拉取失败，请刷新页面重试');
      }
    };

    /* ---------------- detail ---------------- */
    const detail = async (course) => {
      try {
        const { data } = await axios.post('/api/detail', {
          cookie: state.cookie,
          relurl: course.relurl,
        });
        state.dialog = { course: course.name, rows: data };
      } catch {
        showError('详情获取失败');
      }
    };

    /* ---------------- lifecycle ---------------- */
    onMounted(fetchCaptcha);

    /* ---------------- expose to template ---------------- */
    return {
      form,
      ...state,
      fetchCaptcha,
      login,
      detail,
      /* 键盘回车提交 */
      onKeyEnter: (e) => e.key === 'Enter' && login(),
    };
  },
}).mount('#app');
