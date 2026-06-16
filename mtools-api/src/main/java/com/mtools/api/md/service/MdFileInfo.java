package com.mtools.api.md.service;

public record MdFileInfo(
		String path,
		String name,
		long size,
		String modifiedAt
) {
}
