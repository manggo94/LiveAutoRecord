import Vue from 'vue'
import Router from 'vue-router'
import { Route } from 'const'

Vue.use(Router)

const routes = []

// 路由util函数
// =============================================================================

function createRoute (name, component, options) {
  if (component && component.hasOwnProperty('default')) component = component.default

  return Object.assign({
    name,
    path: '/' + name,
    component
  }, options)
}

function createAndAddRoute (...args) {
  let route = createRoute(...args)
  routes.push(route)
  return route
}

// 添加路由
// =============================================================================

createAndAddRoute(Route.Record, require('@/pages/record'))
createAndAddRoute(Route.RecordEdit, require('@/pages/record/edit'))
createAndAddRoute(Route.RecordAdd, require('@/pages/record/edit'))
createAndAddRoute(Route.RecordSetting, require('@/pages/record/setting'))

export default new Router({ routes })
