// File: public/main.js
const { createApp, reactive } = Vue;

createApp({
  setup() {
    const form = reactive({ username:'', password:'', captcha:'' });
    const state = reactive({
      captchaImg:'', token:'', cookie:'',
      courses:[], dialog:null, loading:false, err:''
    });

    const fetchCaptcha = async () => {
      state.loading=true; state.err='';
      try{
        const { data } = await axios.get('/api/captcha');
        state.token = data.token;
        state.captchaImg = data.img;
        form.captcha='';
      }finally{ state.loading=false }
    };

    const login = async () => {
      state.loading=true; state.err='';
      try{
        const { data } = await axios.post('/api/login',{
          token:state.token, username:form.username,
          password:form.password, captcha:form.captcha
        });
        state.cookie = data.cookie;
        await loadGrades();
      }catch(e){
        state.err = e.response?.data?.error || '登录失败';
        await fetchCaptcha();
      }finally{ state.loading=false }
    };

    const loadGrades = async () => {
      const { data } = await axios.post('/api/grades',{ cookie:state.cookie });
      state.courses = data;
    };

    const detail = async (course) => {
      const { data } = await axios.post('/api/detail',{
        cookie:state.cookie, relurl:course.relurl
      });
      state.dialog = { course: course.name, rows: data };
    };

    // 初次加载验证码
    fetchCaptcha();

    return { form, ...state, fetchCaptcha, login, detail };
  }
}).mount('#app');
