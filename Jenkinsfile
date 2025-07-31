import groovy.transform.Field

pipeline {
	agent {
		dockerfile {
			label "docker"
			args "-v /Users/latitude_user/.jenkins/caches/pnpm:/home/latitude_user/.pnpm -v /Users/latitude_user/.jenkins/caches/node_modules:/app/node_modules"
			additionalBuildArgs "--build-arg UID=501 --build-arg VITE_ENV=${env.VITE_ENV ?: 'development'}"
		}
	}
	environment {
		 DEPLOY_SERVER = getDeployServer("${env.GIT_BRANCH}")
		 DEPLOY_DOMAIN = getDeployDomain("${env.GIT_BRANCH}")
		 VERSION_NUMBER = getVersionNumber()
		 VITE_ENV = getENV("${env.GIT_BRANCH}")
		 VITE_BRANCH = "${env.GIT_BRANCH}"
		 VITE_VERSION = "${env.BUILD_NUMBER}"
		 VITE_APP_NAME = 'Expanse Marketing Web'
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

			// Configure pnpm cache and store
			sh '''
				pnpm config set store-dir /home/latitude_user/.pnpm
				pnpm config set cache-dir /home/latitude_user/.pnpm/cache
				echo "PNPM cache configuration:"
				pnpm config get store-dir
				pnpm config get cache-dir
			'''
			
			sh "cd packages/web-app && npm version --no-git-tag-version --no-commit-hooks --new-version ${env.VERSION_NUMBER}"
			
			// Handle submodule authentication first
			sshagent(credentials: ['CI_FORD_GITHUB', 'e5cf0947-b15a-4372-81a1-be32aaf0d466']) {
				sh '''
					mkdir -p ~/.ssh
					ssh-keyscan -H github.ford.com >> ~/.ssh/known_hosts
					ssh-keyscan -H github.com >> ~/.ssh/known_hosts
					git submodule sync --recursive
					git submodule update --init --recursive
					
					# Show cache stats before install
					echo "Cache stats before install:"
					ls -la /home/latitude_user/.pnpm/ || echo "No cache directory found"
					
					# Install all dependencies with legacy peer deps to handle React 16/17 vs 18 conflicts
					pnpm install --frozen-lockfile --config.auto-install-peers=false --config.strict-peer-dependencies=false
					
					# Show cache stats after install
					echo "Cache stats after install:"
					ls -la /home/latitude_user/.pnpm/
				'''
			}
			
			sh "pwd"
			sh "whoami"
			sh "cd packages/web-app && pnpm sentry-cli releases new ${env.BUILD_NUMBER}"
			sh "cd packages/web-app && pnpm sentry-cli releases set-commits ${env.BUILD_NUMBER} --commit latitude-digital/expanse-marketing-monorepo@${env.GIT_COMMIT}"
			sh "cd packages/web-app && pnpm sentry-cli releases finalize ${env.BUILD_NUMBER}"

			// Output the current environment for debugging
			sh "echo \\\"Building with VITE_ENV=${env.VITE_ENV}\\\""
			
			sh "cd packages/web-app && npx kendo-ui-license activate"
		}
	}
	stage("Build") {
		steps {
			// Sync Ford UI before building
			sh "./packages/web-app/scripts/sync-ford-ui.sh"
			// Build web-app with environment variables
			sh "cd packages/web-app && VITE_ENV=${env.VITE_ENV} pnpm run build"
		}
	}
	stage("Deploy") {
		steps {
			// Set VITE_ENV for runtime in the built artifact
			sh "export VITE_ENV=${env.VITE_ENV}"
			// upload support files with 1-week cache
			s3Upload consoleLogLevel: 'INFO', dontSetBuildResultOnFailure: false, dontWaitForConcurrentBuildCompletion: false, entries: [[bucket: env.DEPLOY_SERVER, excludedFile: 'packages/web-app/dist/index.html', flatten: false, gzipFiles: true, keepForever: false, managedArtifacts: false, noUploadOnFailure: true, selectedRegion: 'us-east-1', showDirectlyInBrowser: false, sourceFile: 'packages/web-app/dist/**/*', storageClass: 'STANDARD', uploadFromSlave: false, useServerSideEncryption: false]], pluginFailureResultConstraint: 'FAILURE', profileName: 'latitude-s3-upload-profile', userMetadata: [[key: 'Cache-Control', value: 'max-age=604800']]
			// upload index.html without caching
			s3Upload consoleLogLevel: 'INFO', dontSetBuildResultOnFailure: false, dontWaitForConcurrentBuildCompletion: false, entries: [[bucket: env.DEPLOY_SERVER, excludedFile: '', flatten: false, gzipFiles: true, keepForever: false, managedArtifacts: false, noUploadOnFailure: true, selectedRegion: 'us-east-1', showDirectlyInBrowser: false, sourceFile: 'packages/web-app/dist/index.html', storageClass: 'STANDARD', uploadFromSlave: false, useServerSideEncryption: false]], pluginFailureResultConstraint: 'FAILURE', profileName: 'latitude-s3-upload-profile', userMetadata: [[key: 'Cache-Control', value: 'max-age=0']]
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
	def message = "*${buildStatus} Build*\\n${env.GIT_BRANCH}\\n <${env.BUILD_URL}/console|Build ${env.BUILD_NUMBER}>\\n"
	def blocks = [
		[
			"type": "section",
			"text": [
				"type": "mrkdwn",
				"text": "*${buildStatus} Build*\\n${env.GIT_BRANCH}\\n <${env.BUILD_URL}/console|Build ${env.BUILD_NUMBER}>\\n"
			]
		]
	]

	// Override default values based on build status
	if (buildStatus == 'STARTED') {
		def color = 'BLUE'
		colorCode = '#1F51FF'
	} else if (buildStatus == 'SUCCESSFUL') {
		def color = 'GREEN'
		colorCode = '#00FF00'
		message += "\\n<${env.DEPLOY_DOMAIN}>"
	} else if (buildStatus == 'CANCELED') {
		def color = 'GRAY'
		colorCode = '#333333'
	} else {
		def color = 'RED'
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
	return "1.0.${env.BUILD_NUMBER}";
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