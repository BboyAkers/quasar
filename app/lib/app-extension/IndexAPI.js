const
  appPaths = require('../app-paths'),
  logger = require('../helpers/logger'),
  warn = logger('app:extension(index)', 'red'),
  quasarAppVersion = require('../../package.json').version

/**
 * API for extension's /index.js script
 */
module.exports = class IndexAPI {
  constructor ({ extId, prompts, ctx }) {
    this.ctx = ctx
    this.extId = extId
    this.quasarAppVersion = quasarAppVersion
    this.prompts = prompts
    this.resolve = appPaths.resolve
    this.appDir = appPaths.appDir

    this.__hooks = {
      extendQuasarConf: [],
      extendWebpack: [],
      chainWebpack: [],
      beforeDevStart: [],
      commands: {}
    }
  }

  /**
   * Ensure the App Extension is compatible with
   * locally installed @quasar/app through a
   * semver condition.
   *
   * If the semver condition is not met, then
   * @quasar/app errors out and halts execution
   *
   * Example of semver condition:
   *   '1.x || >=2.5.0 || 5.0.0 - 7.2.3'
   *
   * @param {string} semverCondition
   */
  compatibleWithQuasarApp (semverCondition) {
    const semver = require('semver')

    if (!semver.satisfies(quasarAppVersion, semverCondition)) {
      warn(`⚠️  Extension(${this.extId}): is not compatible with @quasar/app v${quasarAppVersion}`)
      process.exit(1)
    }
  }

  /**
   * Check if another app cli extension is installed
   *
   * @param {string} extId
   * @return {boolean} has the extension installed.
   */
  hasExtension (extId) {
    const extensionJson = require('./extension-json')
    return extensionJson.has(extId)
  }

  /**
   * Extend quasar.conf
   *
   * @param {function} fn
   *   (cfg: Object, ctx: Object) => undefined
   */
  extendQuasarConf (fn) {
    this.__hooks.extendQuasarConf.push({ extId: this.extId, fn })
  }

  /**
   * Chain webpack config
   *
   * @param {function} fn
   *   (cfg: ChainObject, invoke: Object {isClient, isServer}) => undefined
   */
  chainWebpack (fn) {
    this.__hooks.chainWebpack.push({ extId: this.extId, fn })
  }

  /**
   * Extend webpack config
   *
   * @param {function} fn
   *   (cfg: Object, invoke: Object {isClient, isServer}) => undefined
   */
  extendWebpack (fn) {
    this.__hooks.extendWebpack.push({ extId: this.extId, fn })
  }

  /**
   * Register a command that will become available as
   * `quasar run <ext-id> <cmd> [args]`.
   *
   * @param {string} commandName
   * @param {function} fn
   *   (args: { [ string ] }, params: {object} }) => ?Promise
   */
  registerCommand (commandName, fn) {
    this.__hooks.commands[commandName] = fn
  }

  /**
   * Prepare external services before dev command runs.
   *
   * @param {function} fn
   *   () => ?Promise
   */
  beforeDevStart (fn) {
    this.__hooks.beforeDevStart.push({ extId: this.extId, fn })
  }

  /**
   * Private methods
   */

  __getHooks () {
    return this.__hooks
  }
}
