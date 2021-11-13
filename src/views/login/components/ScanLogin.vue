<template>
  <div id="login_container" />
</template>

<script>

export default {
  mounted() {
    const { code } = this.$route.query
    const { state } = this.$route.query
    if (code) {
      this.handleCodeLogin(code, state)
    } else {
      this.ddLoginInit()
    }
  },
  methods: {
    ddLoginInit() {
      const redirectUrl = encodeURIComponent('http://localhost:3001/api/auth/scan') // 后台设置回调域名
      const appid = 'dingdmkxhbyx6aiuhxmp'

      // const redirectUrl = encodeURIComponent('http://sys.pm.uupt.com/')
      // const appid = 'dingoaamdkchi4tg2cfhyw'
      const state = new Date().getTime()
      const dingtalkUrl = `https://oapi.dingtalk.com/connect/oauth2/sns_authorize?appid=${appid}&response_type=code&scope=snsapi_login&state=${state}&redirect_uri=`
      const goto = encodeURIComponent(dingtalkUrl + redirectUrl)
      const obj = DDLogin({
        id: 'login_container',
        goto: goto,
        style: 'border:none;background-color:#FFFFFF;',
        width: '365',
        height: '400'
      })
      const handleMessage = (event) => {
        const origin = event.origin
        console.log('origin', event.origin)
        if (origin === 'https://login.dingtalk.com') {
          const loginTmpCode = event.data
          console.log('loginTmpCode', loginTmpCode)
          console.log(dingtalkUrl + `&loginTmpCode=${loginTmpCode}`)
          window.location.href = dingtalkUrl + `&loginTmpCode=${loginTmpCode}`
        }
      }
      if (typeof window.addEventListener !== 'undefined') {
        window.addEventListener('message', handleMessage, false)
      } else if (typeof window.attachEvent !== 'undefined') {
        window.attachEvent('onmessage', handleMessage)
      }
    },
    handleCodeLogin(code, state) {
      console.log(code, state)
    }
  }
}
</script>
