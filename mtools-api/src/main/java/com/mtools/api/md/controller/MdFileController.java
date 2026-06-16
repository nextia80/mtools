package com.mtools.api.md.controller;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mtools.api.md.request.MdFileContentRequest;
import com.mtools.api.md.service.MdFileInfo;
import com.mtools.api.md.service.MdFileService;

@RestController
public class MdFileController {

	private final MdFileService mdFileService;

	public MdFileController(MdFileService mdFileService) {
		this.mdFileService = mdFileService;
	}

	@GetMapping("/api/md-files")
	public List<MdFileInfo> mdFiles() throws IOException {
		return mdFileService.findAll();
	}

	@GetMapping("/api/md-files/content")
	public Map<String, String> mdFileContent(@RequestParam String path) throws IOException {
		return Map.of("content", mdFileService.read(path));
	}

	@PutMapping("/api/md-files/content")
	public Map<String, String> updateMdFileContent(
			@RequestParam String path,
			@RequestBody MdFileContentRequest request
	) throws IOException {
		mdFileService.write(path, request.content());
		return Map.of("status", "ok");
	}
}
