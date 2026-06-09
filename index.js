module.exports = {
	nodes: [
		require('./dist/nodes/Notifuse/Notifuse.node.js'),
		require('./dist/nodes/NotifuseContactTrigger/NotifuseContactTrigger.node.js'),
		require('./dist/nodes/NotifuseListTrigger/NotifuseListTrigger.node.js'),
		require('./dist/nodes/NotifuseSegmentTrigger/NotifuseSegmentTrigger.node.js'),
		require('./dist/nodes/NotifuseEmailTrigger/NotifuseEmailTrigger.node.js'),
		require('./dist/nodes/NotifuseCustomEventTrigger/NotifuseCustomEventTrigger.node.js'),
	],
	credentials: [require('./dist/credentials/NotifuseApi.credentials.js')],
};
