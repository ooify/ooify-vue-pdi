/**
 * WebSocket 工具类
 * 单例模式，确保整个应用只有一个 WebSocket 连接
 */

class WebSocketService {
    constructor() {
        this.ws = null
        this.userId = null
        this.listeners = new Map() // 存储不同 type 的监听器
        this.reconnectTimer = null
        this.reconnectDelay = 3000 // 重连延迟
    }

    /**
     * 初始化 WebSocket 连接
     * @param {string|number} userId - 用户ID
     * @param {string} url - WebSocket 服务器地址，默认为 ws://localhost:8080/ws/
     */
    connect(userId, url = 'ws://localhost:8080/ws/') {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('WebSocket 已连接，无需重复连接')
            return
        }

        this.userId = userId
        const wsUrl = `${url}${userId}`

        try {
            this.ws = new WebSocket(wsUrl)

            this.ws.onopen = () => {
                console.log('WebSocket 连接成功')
                // 清除重连定时器
                if (this.reconnectTimer) {
                    clearTimeout(this.reconnectTimer)
                    this.reconnectTimer = null
                }
            }

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)
                    console.log('WebSocket 收到消息:', data)

                    // 根据消息类型分发到对应的监听器
                    if (data.type && this.listeners.has(data.type)) {
                        const callbacks = this.listeners.get(data.type)
                        callbacks.forEach((callback) => {
                            try {
                                callback(data)
                            } catch (error) {
                                console.error(`处理 ${data.type} 类型消息时出错:`, error)
                            }
                        })
                    }
                } catch (error) {
                    console.error('解析 WebSocket 消息失败:', error)
                }
            }

            this.ws.onerror = (error) => {
                console.error('WebSocket 连接出错:', error)
            }

            this.ws.onclose = () => {
                console.log('WebSocket 连接关闭')
                // 自动重连
                this.reconnect()
            }
        } catch (error) {
            console.error('创建 WebSocket 连接失败:', error)
            this.reconnect()
        }
    }

    /**
     * 重连 WebSocket
     */
    reconnect() {
        if (this.reconnectTimer) {
            return
        }

        this.reconnectTimer = setTimeout(() => {
            console.log('尝试重新连接 WebSocket...')
            this.connect(this.userId)
        }, this.reconnectDelay)
    }

    /**
     * 订阅特定类型的消息
     * @param {string} type - 消息类型
     * @param {Function} callback - 回调函数
     * @returns {Function} 取消订阅的函数
     */
    subscribe(type, callback) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, [])
        }

        const callbacks = this.listeners.get(type)
        callbacks.push(callback)

        // 返回取消订阅的函数
        return () => {
            this.unsubscribe(type, callback)
        }
    }

    /**
     * 取消订阅
     * @param {string} type - 消息类型
     * @param {Function} callback - 回调函数
     */
    unsubscribe(type, callback) {
        if (!this.listeners.has(type)) {
            return
        }

        const callbacks = this.listeners.get(type)
        const index = callbacks.indexOf(callback)
        if (index > -1) {
            callbacks.splice(index, 1)
        }

        // 如果该类型没有监听器了，删除该类型
        if (callbacks.length === 0) {
            this.listeners.delete(type)
        }
    }

    /**
     * 发送消息
     * @param {any} data - 要发送的数据
     */
    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const message = typeof data === 'string' ? data : JSON.stringify(data)
            this.ws.send(message)
        } else {
            console.warn('WebSocket 未连接，无法发送消息')
        }
    }

    /**
     * 关闭 WebSocket 连接
     */
    close() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = null
        }

        if (this.ws) {
            this.ws.close()
            this.ws = null
        }

        // 清空所有监听器
        this.listeners.clear()
    }

    /**
     * 获取连接状态
     */
    getReadyState() {
        return this.ws ? this.ws.readyState : WebSocket.CLOSED
    }

    /**
     * 是否已连接
     */
    isConnected() {
        return this.ws && this.ws.readyState === WebSocket.OPEN
    }
}

// 导出单例
export default new WebSocketService()
