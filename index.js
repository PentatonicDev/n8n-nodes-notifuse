module.exports = {
	nodes: [
		require('./dist/nodes/Notifuse/Notifuse.node.js'),
		require('./dist/nodes/NotifuseTrigger/NotifuseTrigger.node.js'),
	],
	credentials: [require('./dist/credentials/NotifuseApi.credentials.js')],
};
