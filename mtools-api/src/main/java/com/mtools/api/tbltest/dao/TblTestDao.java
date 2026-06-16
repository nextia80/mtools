package com.mtools.api.tbltest.dao;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface TblTestDao {

	List<Map<String, Object>> findAll();
}
