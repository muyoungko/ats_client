# Auto Test Client

Auto test client is for test with real mobile phone which is your own device.

Cloud Real Device Auto Test Platform : http://www.autotesthub.co.kr.s3-website.ap-northeast-2.amazonaws.com/

Create code with web console then execute or schedule it.
You can use your own device or another's public device. 

If you want to use your own device, use this 'Auto Test Client'

# pre condition
python3 command should be available. 
* $ python3
adb command(Android Studio installed) should be available for Android Test 
* $ adb
instruments command(Xcode installed) should be available for iOS Test
* $ instruments

# instruction
* Install node  at https://nodejs.org/ko/download/
* python3 -m pip install Appium-Python-Client
    ```shell
    $ python3 -m pip install Appium-Python-Client
    ```   
* python3 -m pip install requests    
    ```shell
    $ python3 -m pip install requests
    ```   
* python3 -m pip install Image
    ```shell
    $ python3 -m pip install Image
    ```
* Install Android Studio at https://developer.android.com/studio/install
* iOS is preparing...

# Install - Auto Test Client
```shell
$ npm -g i ats_client
```

# Envirnonment Variable
```shell
$ vi ~/.bash_profile

#add following two line [Change to yours]
export JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk1.8.0_241.jdk/Contents/Home
export ANDROID_HOME=/Users/[Your Mac Id]/Library/Android/sdk

$ source ~/.bash_profile
```

# Execution
```shell
$ ats_client

Welcome Auto Test Hub
Get your client token in here - http://www.autotesthub.co.kr.s3-website.ap-northeast-2.amazonaws.com/#/token
Please enter the client token(default - eyJhbGciOi...) :
```


# Trouble Shooting

* When iphone excution failed with provisioning problem
Xcode 열기
open /usr/local/lib/node_modules/ats_client/node_modules/appium/node_modules/appium-webdriveragent/WebDriverAgent.xcodeproj
좌상단 WebDriverAgent > Targets > WebDriverAgentRunner 
상단 탭 > Build Settings > all | combinded

설정값 변경
Signing > Developopment Team 을 muyoungko로
Signing > Code Signing Style을 Manual로
Signing > Provisioning Profile 을 wildcard3으로


좌상단 WebDriverAgent > Targets > WebDriverAgentRunner 에서 했던 설정을 
좌상단 WebDriverAgent > Targets > IntegrationApp도 

좌상단 Play 버튼우측에 자신의 기기를 선택한후 Play버튼 클릭해서 성공하면 끝



