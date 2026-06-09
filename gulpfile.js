const path = require('path');
const { task, src, dest, parallel } = require('gulp');

function copyNodeIcons() {
	return src(path.resolve('nodes', '**', '*.{png,svg}')).pipe(dest(path.resolve('dist', 'nodes')));
}

function copyCredentialIcons() {
	// Match icons directly under credentials/ as well as any nested folder.
	return src(
		[path.resolve('credentials', '*.{png,svg}'), path.resolve('credentials', '**', '*.{png,svg}')],
		{ allowEmpty: true },
	).pipe(dest(path.resolve('dist', 'credentials')));
}

task('build:icons', parallel(copyNodeIcons, copyCredentialIcons));
