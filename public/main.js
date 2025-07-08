const { createApp, reactive, ref, onMounted } = Vue;

createApp({
  setup() {
    /* ------------ state ------------ */
    const form   = reactive({ username: '', password: '', captcha: '' });
    const state  = reactive({
      captchaImg: '',     // base64
      token: '',          // JSESSIONID 映射 token
      cookie: '',         // 后端 set 的 login cookie
      courses: [],
      dialog: null,
      loading: false
    });
    const toast = ref('');          // 错误提示文字
    let   toastTimer = null;

    /* ------------ helpers ------------ */
    const showToast = (msg) => {
      clearTimeout(toastTimer);
      toast.value = msg;
      toastTimer  = setTimeout(()=> toast.value='', 3000);
    };
    const saveCookie = (cookie) => {
      localStorage.setItem('gdufs_cookie', JSON.stringify({
        value: cookie, ts: Date.now()
      }));
    };
    const loadCookie = () => {
      const raw = localStorage.getItem('gdufs_cookie');
      if (!raw) return '';
      const { value, ts } = JSON.parse(raw);
      return (Date.now() - ts < 30*60*1000) ? value : '';   // 30 min
    };

    /* ------------ captcha ------------ */
    const fetchCaptcha = async () => {
      state.loading = true;
      try {
        const { data } = await axios.get('/api/captcha');
        state.token      = data.token;
        state.captchaImg = data.img;
        form.captcha     = '';
      } catch { showToast('验证码获取失败'); }
      finally { state.loading = false; }
    };

    /* ------------ login ------------ */
    const login = async () => {
      if (!form.username || !form.password || !form.captcha) {
        showToast('请填写全部信息'); return;
      }
      state.loading = true;
      try {
        const { data } = await axios.post('/api/login', {
          token: state.token,
          username: form.username,
          password: form.password,
          captcha:  form.captcha
        });
        state.cookie = data.cookie;
        saveCookie(state.cookie);
        await loadGrades();
      } catch (e) {
        showToast(e.response?.data?.error || '登录失败');
        await fetchCaptcha();
      } finally { state.loading = false; }
    };

    /* ------------ grades ------------ */
    const loadGrades = async () => {
      try {
        const { data } = await axios.post('/api/grades', { cookie: state.cookie });
        state.courses = data;
      } catch { showToast('成绩获取失败'); }
    };

    /* ------------ detail ------------ */
    const detail = async (course) => {
      try {
        const { data } = await axios.post('/api/detail', {
          cookie: state.cookie,
          relurl: course.relurl
        });
        state.dialog = { course: course.name, rows: data };
      } catch { showToast('详情获取失败'); }
    };

    /* ------------ lifecycle ------------ */
    onMounted(async () => {
      // 先尝试复用 cookie
      state.cookie = loadCookie();
      if (state.cookie) {
        await loadGrades().catch(()=>{ state.cookie=''; localStorage.removeItem('gdufs_cookie'); });
      }
      if (!state.cookie) fetchCaptcha();
    });

    /* ------------ expose ------------ */
    return {
      form, state, toast,
      fetchCaptcha, login, loadGrades, detail,
      // keyup.enter 提交
      onKey: (e) => { if (e.key === 'Enter') login(); }
    };
  }
}).mount('#app');
