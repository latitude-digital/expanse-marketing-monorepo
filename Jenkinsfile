import groovy.transform.Field

pipeline {
	agent {
		dockerfile {
			label "docker"
			args "-v /Users/latitude_user/.jenkins/caches/yarn:/home/latitude_user/.yarn"
			additionalBuildArgs "--build-arg UID=\$(id -u latitude_user) --build-arg GID=\$(id -g latitude_user) --build-arg REACT_APP_ENV=${env.REACT_APP_ENV}"
		}
	}
	environment {
		 DEPLOY_SERVER = getDeployServer("${env.GIT_BRANCH}")
		 DEPLOY_DOMAIN = getDeployDomain("${env.GIT_BRANCH}")
		 VERSION_NUMBER = getVersionNumber()
		 REACT_APP_ENV = getENV("${env.GIT_BRANCH}")
		 REACT_APP_BRANCH = "${env.GIT_BRANCH}"
		 REACT_APP_VERSION = "${env.BUILD_NUMBER}"
		 REACT_APP_NAME = 'Latitude Leads Web'
		 SENTRY_AUTH_TOKEN = credentials('EXPANSE_WEB_SENTRY_AUTH_TOKEN')
		 SENTRY_ORG = 'latitude-digital'
		 SENTRY_PROJECT = 'expanse-marketing'
		 SENTRY_LOG_LEVEL = 'debug'
	 }
	 stages {
		stage("Begin") {
			steps {
				notifyBuild("STARTED")

				withCredentials([file(credentialsId: 'ford-jfrog-npmrc', variable: 'JFROG_NPMRC')]) {
					writeFile file: '.npmrc', text: readFile(env.JFROG_NPMRC)
				}

				sh "yarn cache dir"
				sh "yarn version --no-git-tag-version --no-commit-hooks --new-version ${env.VERSION_NUMBER}"
				sshagent(credentials: ['CI_FORD_GITHUB', 'e5cf0947-b15a-4372-81a1-be32aaf0d466']) {
					sh "yarn"
				}
				sh "pwd"
				sh "whoami"
				sh "yarn sentry-cli releases new ${env.BUILD_NUMBER}"
				sh "yarn sentry-cli releases set-commits ${env.BUILD_NUMBER} --commit latitude-digital/latitude-leads-web@${env.GIT_COMMIT}"
				sh "yarn sentry-cli releases finalize ${env.BUILD_NUMBER}"

				// Output the current environment for debugging
				sh "echo \"Building with REACT_APP_ENV=${env.REACT_APP_ENV}\""
				
				// sh "sed -i -- 's/%REACTBUILDVERSION%/${env.VERSION_NUMBER}/g' src/index.js"
				sh "npx kendo-ui-license activate"
				// sh "npx browserslist@latest --update-db"
			}
		}
		stage("Build") {
			steps {
				// Pass environment variables to build
				sh "REACT_APP_ENV=${env.REACT_APP_ENV} yarn run build"
				// No longer generate env-config.js; environment is set at build time
			}
		}
		stage("Deploy") {
			steps {
				// Set REACT_APP_ENV for runtime in the built artifact (for Docker runtime)
				sh "export REACT_APP_ENV=${env.REACT_APP_ENV}"
				// upload sourcemaps
				// sh "yarn run bugsnag-source-maps upload-browser --api-key 94d1fd5e974597dca79ce3ae87248163 --app-version ${env.VERSION_NUMBER} --base-url ${env.DEPLOY_DOMAIN}/static/js/ --directory build/static/js"
				// upload support files with 1-week cache
				s3Upload consoleLogLevel: 'INFO', dontSetBuildResultOnFailure: false, dontWaitForConcurrentBuildCompletion: false, entries: [[bucket: env.DEPLOY_SERVER, excludedFile: 'build/index.html', flatten: false, gzipFiles: true, keepForever: false, managedArtifacts: false, noUploadOnFailure: true, selectedRegion: 'us-east-1', showDirectlyInBrowser: false, sourceFile: 'build/**/*', storageClass: 'STANDARD', uploadFromSlave: false, useServerSideEncryption: false]], pluginFailureResultConstraint: 'FAILURE', profileName: 'latitude-s3-upload-profile', userMetadata: [[key: 'Cache-Control', value: 'max-age=604800']]
				// upload index.html without caching
				s3Upload consoleLogLevel: 'INFO', dontSetBuildResultOnFailure: false, dontWaitForConcurrentBuildCompletion: false, entries: [[bucket: env.DEPLOY_SERVER, excludedFile: '', flatten: false, gzipFiles: true, keepForever: false, managedArtifacts: false, noUploadOnFailure: true, selectedRegion: 'us-east-1', showDirectlyInBrowser: false, sourceFile: 'build/index.html', storageClass: 'STANDARD', uploadFromSlave: false, useServerSideEncryption: false]], pluginFailureResultConstraint: 'FAILURE', profileName: 'latitude-s3-upload-profile', userMetadata: [[key: 'Cache-Control', value: 'max-age=0']]
			}
		}
	}
	post {
		success {
			notifyBuild("SUCCESSFUL")
		}
		aborted {
			notifyBuild("CANCELED")
		}
		failure {
			notifyBuild("FAILED")
		}
		unstable {
			notifyBuild("UNSTABLE")
		}
		// unsuccessful {
		// 	notifyBuild("UNSUCCESSFUL")
		// }
	}
}

@Field String buildThread = "lead-collector"

def notifyBuild(String buildStatus = 'STARTED') {
	println "buildStatus: " + buildStatus;
	// build status of null means successful
	buildStatus =	buildStatus ?: 'SUCCESSFUL'

	// Default values
	def tempResponse = ""
	def colorName = 'RED'
	def colorCode = '#FF0000'
	def message = "*${buildStatus} Build*\n${env.GIT_BRANCH}\n <${env.BUILD_URL}/console|Build ${env.BUILD_NUMBER}>\n"
	def blocks = [
		[
			"type": "section",
			"text": [
				"type": "mrkdwn",
				"text": "*${buildStatus} Build*\n${env.GIT_BRANCH}\n <${env.BUILD_URL}/console|Build ${env.BUILD_NUMBER}>\n"
			]
		]
	]

	// Override default values based on build status
	if (buildStatus == 'STARTED') {
		color = 'BLUE'
		colorCode = '#1F51FF'
	} else if (buildStatus == 'SUCCESSFUL') {
		color = 'GREEN'
		colorCode = '#00FF00'
		message += "\n<${env.DEPLOY_DOMAIN}>"
	} else if (buildStatus == 'CANCELED') {
		color = 'GRAY'
		colorCode = '#333333'
	} else {
		color = 'RED'
		colorCode = '#FF0000'
	}

	// Send notifications
	println "sending to slack";
	tempResponse = slackSend ( channel:buildThread, color: colorCode, message: message )

	if (buildStatus == 'STARTED') {
		println "holding on to my thread";
		// re-enable this line if you want to have threaded build notifications
		// buildThread = tempResponse.threadId
	}
}

def getVersionNumber() {
	return "0.1.${env.BUILD_NUMBER}";
}

def getDeployServer(branchName) {
	if("origin/staging" == branchName) {
		return "staging.survey.expansemarketing.com";
	} else if ("origin/main" == branchName) {
		return "survey.expansemarketing.com";
	} else {
		return "";
	}
}

def getDeployDomain(branchName) {
	if("origin/staging" == branchName) {
		return "https://survey.staging.expansemarketing.com/";
	} else if ("origin/main" == branchName) {
		return "https://expansemarketing.com/";
	} else {
		return "http://localhost:8080";
	}
}

def getENV(branchName) {
	if("origin/staging" == branchName) {
		return "staging";
	} else if ("origin/main" == branchName) {
		return "production";
	} else {
		return "development";
	}
}