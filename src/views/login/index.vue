<template>
  <div class="login-container">
    <div class="login-body">
      <div class="title-container">
        <h3 class="title">AutoLogSystem</h3>
        <div class="login_header">
          <a :class="{active:cur==true}" @click="cur=true">扫码登录</a>
          <a :class="{active:cur==false}" @click="cur=false">密码登录</a>
        </div>
      </div>
      <div class="login_content">
        <div v-show="cur==true" class="show_item">
          <ScanLogin align="center" />
        </div>
        <div v-show="cur==false" class="show_item">
          <PasswdLogin />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ScanLogin from '@/views/login/components/ScanLogin'
import PasswdLogin from '@/views/login/components/PasswdLogin'
import Cookie from 'js-cookie'
import moment from 'moment'

export default {
  name: 'Login',
  components: { ScanLogin, PasswdLogin },

  data() {
    return {
      cur: true,
      loading: false,
      timer: 0,
      redirect: undefined
    }
  },
  watch: {
    $route: {
      handler: function(route) {
        this.redirect = route.query && route.query.redirect
      },
      immediate: true
    },
    timer(num) {
      if (num > 0) {
        setTimeout(() => {
          this.timer = --num
        }, 1000)
      }
    }
  },
  created() {
    const lastSendTime = Cookie.get('last-send-time')
    if (lastSendTime) {
      const timer = 60 - moment().diff(moment(lastSendTime), 'seconds')
      this.timer = timer > 0 ? timer : 0
    }
  },

  methods: {
    // handleLogin() {
    //   this.$refs.loginForm.validate(valid => {
    //     if (valid) {
    //       this.loading = true
    //       this.$store
    //         .dispatch('这里是登录地址', this.loginForm)
    //         .then(() => {
    //           this.$router.push({ path: '这里是登录成功跳转的页面' })
    //           this.loading = false
    //         })
    //         .catch(() => {
    //           this.loading = false
    //         })
    //     } else {
    //       console.log('error submit!!')
    //       return false
    //     }
    //   })
    // }
  }
}

</script>

<!--<style lang="scss">-->
<!--/* 修复input 背景不协调 和光标变色 */-->
<!--/* Detail see https://github.com/PanJiaChen/vue-element-admin/pull/927 */-->

<!--$bg:#283443;-->
<!--$light_gray:#fff;-->
<!--$cursor: #fff;-->

<!--@supports (-webkit-mask: none) and (not (cater-color: $cursor)) {-->
<!--  .login-container .el-input input {-->
<!--    color: $cursor;-->
<!--  }-->
<!--}-->

<!--/* reset element-ui css */-->
<!--.login-container {-->
<!--  .el-input {-->
<!--    display: inline-block;-->
<!--    height: 47px;-->
<!--    width: 85%;-->

<!--    input {-->
<!--      background: transparent;-->
<!--      border: 0px;-->
<!--      -webkit-appearance: none;-->
<!--      border-radius: 0px;-->
<!--      padding: 12px 5px 12px 15px;-->
<!--      color: $light_gray;-->
<!--      height: 47px;-->
<!--      caret-color: $cursor;-->

<!--      &:-webkit-autofill {-->
<!--        box-shadow: 0 0 0px 1000px $bg inset !important;-->
<!--        -webkit-text-fill-color: $cursor !important;-->
<!--      }-->
<!--    }-->
<!--  }-->

<!--  .el-form-item {-->
<!--    border: 1px solid rgba(255, 255, 255, 0.1);-->
<!--    background: rgba(0, 0, 0, 0.1);-->
<!--    border-radius: 5px;-->
<!--    color: #454545;-->
<!--  }-->
<!--}-->
<!--</style>-->

<style lang="scss" scoped>
$bg: #2d3a4b;
$dark_gray: #889aa4;
$light_gray: #eee;

.login-container {
  min-height: 100%;
  width: 100%;
  background-color: $bg;
  overflow: hidden;

  .login-body {
    position: relative;
    width: 520px;
    max-width: 100%;
    padding: 160px 35px 0;
    margin: 0 auto;
    overflow: hidden;
  }

  .tips {
    font-size: 14px;
    color: #fff;
    margin-bottom: 10px;

    span {
      &:first-of-type {
        margin-right: 16px;
      }
    }
  }

  .title-container {
    position: relative;

    .title {
      font-size: 26px;
      color: $light_gray;
      margin: 0px auto 40px auto;
      text-align: center;
      font-weight: bold;
    }
  }

  a {
    color: #fff;
    margin: 50px;
  }

  .login_header {
    margin-bottom: 30px;
    text-align: center;
  }

  .login_header span {
    margin-right: 20px;
    cursor: pointer;
  }

  .show_item {
    border: 0px solid #999;
    overflow: hidden;
  }

  .active {
    color: #fff;
    padding-bottom: 10px;
    border-bottom: 3px solid #fff;
  }
}
</style>
